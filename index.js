#!/usr/bin/env node

const bytes = require('utf8-length')
const chrono = require('chrono-node')
const express = require('express')
const franc = require('franc')
const fs = require('fs')
const htmldiff = require('node-htmldiff')
const iso639 = require('iso-639-3')
const {JSDOM, VirtualConsole} = require('jsdom')
const {memoize} = require('lodash')
const path = require('path')
const prerender = require('prerender')
const querystring = require('querystring')
const r2 = require('r2')
const {Readability} = require('readability/index')
const {spawn} = require('child_process')
const tldjs = require('tldjs')
const URL = require('url')
const yaml = require('js-yaml')

const {findNextPageLink} = require('./readability.js')

require('prerender/lib/util').log = console.error

const shortLang = {}
for (const {iso6391, iso6393} of iso639) shortLang[iso6393] = iso6391

const trailingPunctuation = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]$/

function removeNode (node) {
  node.parentNode.removeChild(node)
}

function removeNodes (nodes) {
  for (let i = nodes.length - 1; i >= 0; i--) removeNode(nodes[i])
}

function nonempty (node) {
  return node.textContent.trim() || node.querySelector('img')
}

function forEachR (a, f) {
  for (let i = a.length - 1; i >= 0; i--) f(a[i])
}

async function waitProcess (proc) {
  return new Promise((resolve, reject) => {
    proc.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`child process exited with code ${code}`))
      }
    })
  })
}

async function eof (stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
  })
}

async function sigint () {
  return new Promise((resolve, reject) => {
    process.on('SIGINT', resolve)
  })
}

async function readStream (stream) {
  let chunks = []
  stream.setEncoding('utf8')
  stream.on('data', [].push.bind(chunks))
  await eof(stream)
  return chunks.join('')
}

async function pipe (name, input, ...args) {
  let proc = spawn(name, args, {stdio: ['pipe', 'pipe', process.stderr]})
  proc.stdin.end(input)
  return readStream(proc.stdout)
}

async function less (output) {
  if (process.stdout.isTTY && output.split(/\n/).length >= process.stdout.rows) {
    let less = spawn('less', [], {
      stdio: ['pipe', process.stdout, process.stderr]
    })
    less.stdin.end(output)
    await waitProcess(less)
  } else {
    process.stdout.write(output)
  }
}

function srcsetMax (srcset) {
  let urlBest = ''
  let valBest = 0
  for (let alt of srcset.split(', ')) {
    alt = alt.trim().split(/\s+/)
    let url = alt[0]
    let val = alt.length > 1 ? parseFloat(alt[1]) : 1
    if (val > valBest) {
      urlBest = url
      valBest = val
    }
  }
  return urlBest
}

function applyFilterList (fname, body, domain) {
  let classes = new Set()
  let ids = new Set()
  let selectors = []
  let domainSelectors = {}

  let lines = fs.readFileSync(path.resolve(__dirname, fname), 'ascii').split('\n')
  for (const line of lines) {
    let rule = line.split('##') // cosmetic filters
    if (rule.length !== 2) continue
    let [domains, selector] = rule

    // skip rules that trigger syntax errors
    if (selector.includes('onclick^') || selector.includes('[body]')) continue

    if (domains === '') { // generic filter
      if (selector.startsWith('.')) {
        classes.add(selector.slice(1))
      } else if (selector.startsWith('#')) {
        ids.add(selector.slice(1))
      } else {
        selectors.push(selector)
      }
      continue
    }

    for (const domain of domains.split(',')) {
      if (!domainSelectors[domain]) domainSelectors[domain] = []
      domainSelectors[domain].push(selector)
    }
  }

  forEachR(body.querySelectorAll('[class]'), node => {
    for (let i = 0; i < node.classList.length; i++) {
      if (classes.has(node.classList[i])) {
        removeNode(node)
        break
      }
    }
  })

  forEachR(body.querySelectorAll('[id]'), node => {
    if (ids.has(node.id)) removeNode(node)
  })

  removeNodes(body.querySelectorAll(selectors.join()))

  if (domainSelectors[domain]) {
    removeNodes(body.querySelectorAll(domainSelectors[domain].join()))
  }
}

const waybackTimestamps = memoize(async (url) => {
  let cdx = 'https://web.archive.org/cdx/search/cdx?' + querystring.stringify({
    fl: 'timestamp',
    filter: 'statuscode:200',
    collapse: 'digest',
    url
  })
  let resp
  try {
    resp = await r2(cdx).text
  } catch (e) {
    resp = await r2(cdx).text
  }
  return resp.trim().split('\n')
})

const virtualConsole = new VirtualConsole()
virtualConsole.sendTo(console, {omitJSDOMErrors: true})
const optionsJSDOM = {virtualConsole}

async function fromURL (url) {
  let match = url.match(/^https:\/\/web.archive.org\/web\/([0-9]+)\/(.*)/)
  if (match) {
    url = match[2]
    let timestamp = match[1]
    let timestamps = await waybackTimestamps(url)
    let i = timestamps.findIndex(t => t > timestamp)
    if (i > 0) i--; else if (i < 0) i = timestamps.length - 1
    url = `https://web.archive.org/web/${timestamps[i]}/${url}`
    if (timestamp !== timestamps[i]) console.error('Rewriting to', url)
  }

  try {
    return await JSDOM.fromURL(url, optionsJSDOM)
  } catch (e) {
    console.error('Retrying ' + url)
    return JSDOM.fromURL(url, optionsJSDOM)
  }
}

async function jsdom (url, allowLocal) {
  let parsed = URL.parse(url)
  if (parsed.protocol && parsed.hostname) return fromURL(url)
  if (allowLocal && url.endsWith('.html') && fs.existsSync(url)) {
    let html = fs.readFileSync(url, 'utf8')
    return new JSDOM(html, optionsJSDOM)
  }
  return null
}

const prerenderServer = memoize(async () => {
  let server = prerender()
  await server.startPrerender()
  process.on('exit', () => server.killBrowser())
  return 'http://localhost:3000/render?'
})

async function preprocess (window,
  {loc = window.location, allowPrerender = true, pages = new Set(), lastPageScore = 0} = {}) {
  let document = window.document

  let canonical = document.querySelector('link[rel="canonical"]')
  if (loc.href === 'about:blank' && canonical) loc = URL.parse(canonical.href)
  canonical = document.querySelector('meta[property="og:url"]')
  if (loc.href === 'about:blank' && canonical) loc = URL.parse(canonical.content)

  let base = document.getElementsByTagName('base')[0]
  if (base) {
    base.href = URL.resolve(loc.href, base.href)
  } else {
    base = document.createElement('base')
    base.href = loc.href
    base = document.head.appendChild(base)
  }

  let domain = tldjs.getDomain(loc.href)
  applyFilterList('easylist/fanboy-annoyance.txt', document.body, domain)

  removeNodes(document.body.querySelectorAll('[class*="hidden"]'))

  forEachR(document.getElementsByTagName('a'), link => {
    if (link.href && link.getAttribute('href').startsWith('#')) {
      link.removeAttribute('href')
    }
  })

  forEachR(document.querySelectorAll('pre a'), link => {
    link.outerHTML = link.innerHTML
  })

  forEachR(document.querySelectorAll('a, em, strong, b, i'), node => {
    if (nonempty(node)) {
      let prep = /^\s/.test(node.innerHTML) ? ' ' : ''
      let post = /\s$/.test(node.innerHTML) ? ' ' : ''
      node.innerHTML = node.innerHTML.trim()
      node.outerHTML = prep + node.outerHTML + post
    } else {
      node.outerHTML = node.innerHTML
    }
  })

  forEachR(document.getElementsByTagName('img'), image => {
    if (image.hasAttribute('data-src')) {
      let src = image.getAttribute('data-src')
      if (src && !src.startsWith('{')) image.src = src
    }
    if (image.srcset) image.src = srcsetMax(image.srcset)
    if (image.src === '' || image.width === 1) removeNode(image)
  })

  forEachR(document.getElementsByTagName('picture'), picture => {
    forEachR(picture.getElementsByTagName('source'), source => {
      if (!source.media.includes('max-width')) {
        let srcset = source.srcset || source.getAttribute('data-srcset')
        if (srcset.includes(' ')) srcset = srcsetMax(srcset)
        picture.outerHTML = '<img src="' + srcset + '">'
      }
    })
  })

  forEachR(document.getElementsByTagName('table'), table => {
    if (table.rows.length === 1 && table.rows[0].cells.length === 1) {
      table.outerHTML = table.rows[0].cells[0].innerHTML
    }
  })

  forEachR(document.getElementsByTagName('li'), item => {
    item.removeAttribute('id')
  })

  forEachR(document.getElementsByTagName('code'), code => {
    if (code.textContent.split('\n').length > 2) {
      code.outerHTML = '<pre>' + code.outerHTML + '</pre>'
    }
  })

  forEachR(document.getElementsByTagName('figure'), fig => {
    if (fig.getElementsByTagName('figcaption').length === 0) {
      fig.outerHTML = '<div>' + fig.innerHTML + '</div>'
    }
  })

  forEachR(document.querySelectorAll(
    'h1 br, h2 br, h3 br, h4 br, h5 br, h6 br'), br => {
    br.outerHTML = ' '
  })

  let waybackToolbar = document.getElementById('wm-ipp')
  if (waybackToolbar) removeNode(waybackToolbar)

  removeNodes(document.getElementsByClassName('mw-editsection'))

  let span
  while ((span = document.querySelector('span'))) {
    span.outerHTML = span.innerHTML
  }

  let article = {
    title: document.title,
    content: document.documentElement.outerHTML
  }

  let {href: nextPageLink, score: nextPageScore} = findNextPageLink(loc, document.body, pages) || {}
  if (nextPageLink) {
    forEachR(document.getElementsByTagName('a'), link => {
      if (link.href === nextPageLink + '/') nextPageLink = link.href
    })
    if ((pages.size === 1 && !nextPageLink.startsWith(loc.href)) ||
        nextPageScore < lastPageScore - 50) {
      console.error('Skipping inconsistent next page link', nextPageLink)
      nextPageLink = null
    }
  }

  let parsed = new Readability(null, document).parse()
  if (parsed && parsed.content.replace(/<.*?>/g, '').length > 200) {
    article = parsed
  } else if (allowPrerender) {
    let server = await prerenderServer()
    let dom = await fromURL(server + querystring.stringify({
      url: loc.href,
      renderType: 'html',
      followRedirects: true,
      javascript: ''
    }))
    article = await preprocess(dom.window, {loc, allowPrerender: false, pages})
  }

  article.title = article.title.replace(/\s+/g, ' ')
  if (article.byline) {
    article.author = article.byline.replace(/\s+/g, ' ').replace(/^by /i, '')
    let dates = chrono.parse(article.author)
    if (dates.length > 0) {
      article.date = dates[0].text
      article.author = article.author.replace(article.date, '')
        .trim().replace(trailingPunctuation, '').trim()
    }
  }

  article.content = article.content
    .replace(/<(embed|iframe|video|audio) /g, '<img ')
    .replace(/<p style="display: inline;" class="readability-styled">([^<]*)<\/p>/g, '$1')

  if (!article.content.includes('<h2')) {
    article.content = article.content
      .replace(/<h3>(.*?)<\/h3>/g, '<h2>$1</h2>')
      .replace(/<h4>(.*?)<\/h4>/g, '<h3>$1</h3>')
      .replace(/<h5>(.*?)<\/h5>/g, '<h4>$1</h4>')
      .replace(/<h6>(.*?)<\/h6>/g, '<h5>$1</h5>')
  }

  if (nextPageLink && pages.size < 10) {
    console.error(`Fetching page ${pages.size + 1} from ${nextPageLink}`)
    let dom = await fromURL(nextPageLink)
    let rest = await preprocess(dom.window, {pages, lastPageScore: nextPageScore})
    article.content += rest.content
  } else if (nextPageLink) {
    article.content += '<p><a href="' + nextPageLink + '">Next Page</a></p>'
  }

  return article
}

async function postprocess (content, opts) {
  let markdown = [
    'markdown',
    '-bracketed_spans',
    '-citations',
    '-escaped_line_breaks',
    '-fenced_code_attributes',
    '-fenced_divs',
    '-header_attributes',
    '-inline_code_attributes',
    '-link_attributes',
    '-multiline_tables',
    '-native_divs',
    '-native_spans',
    '-pipe_tables',
    '-raw_html',
    '-simple_tables'
  ].join('')
  let output = await pipe('pandoc', content, '--from=html',
    '--to=' + markdown + '-smart', '--reference-links')
  return pipe('pandoc', output, '--from=' + markdown,
    '--to=' + markdown + '-smart', '--reference-links', ...opts)
}

function postprocessDiff (html) {
  let dom = new JSDOM(html, optionsJSDOM)
  let document = dom.window.document
  forEachR(document.getElementsByTagName('del'), del => {
    del.outerHTML = '<span class="del">' + del.innerHTML + '</span>'
  })
  forEachR(document.getElementsByTagName('ins'), ins => {
    ins.outerHTML = '<span class="ins">' + ins.innerHTML + '</span>'
  })
  forEachR(document.getElementsByTagName('span'), span => {
    let content = span.innerHTML
    let par = span.parentNode
    if (par && par.childNodes.length === 1 &&
        ['a', 'em', 'strong'].includes(par.tagName.toLowerCase())) {
      par.innerHTML = content
      par.outerHTML = '<span class="' + span.className + '">' + par.outerHTML + '</span>'
    }
  })
  forEachR(document.getElementsByTagName('span'), span => {
    let next = span.nextSibling
    if (next && span.className === next.className) {
      span.innerHTML += next.innerHTML
      removeNode(next)
    }
  })
  forEachR(document.getElementsByTagName('p'), para => {
    let ch = para.childNodes
    if (ch.length === 2 && ch[0].className === 'del' && ch[1].className === 'ins') {
      para.outerHTML = '<p>' + ch[0].outerHTML + '</p><p>' + ch[1].outerHTML + '</p>'
    }
  })
  forEachR(document.getElementsByTagName('span'), span => {
    let next = span.nextSibling
    if (next && span.className === 'del' && next.className === 'ins') {
      span.outerHTML = '<span class="sub">' + span.outerHTML + next.outerHTML + '</span>'
      removeNode(next)
    }
  })
  return document.documentElement.outerHTML
}

async function diff (text1, text2) {
  let html = htmldiff(await pipe('pandoc', text1), await pipe('pandoc', text2))
  let unmodified = html.replace(/<del.*?del>/g, '').replace(/<ins.*?ins>/g, '')
  let similarity = unmodified.length / html.length
  if (similarity < 0.5) {
    console.error(Math.round(100 - 100 * similarity) + '% of the content has changed')
    return null
  }
  html = postprocessDiff(html)
  let output = await pipe('pandoc', html, '--from=html',
    '--to=markdown-bracketed_spans-header_attributes-smart',
    '--reference-links', '--atx-headers', '--wrap=none')
  output = output
    .replace(/<span class="sub"><span class="del">(.*?)<\/span><span class="ins">(.*?)<\/span><\/span>/g, '{~~$1~>$2~~}')
    .replace(/<span class="del">(.*?)<\/span>/g, '{--$1--}')
    .replace(/<span class="ins">(.*?)<\/span>/g, '{++$1++}')
  return output
}

const HN_URL = 'https://news.ycombinator.com/item?id='
async function hn (id) {
  return r2('https://hacker-news.firebaseio.com/v0/item/' + id + '.json').json
}

async function peruse (url, opts = [], allowLocal = true) {
  let postscript = ''
  if (url.startsWith(HN_URL)) {
    let item = await hn(url.replace(HN_URL, ''))
    if (item.kids.length > 0) postscript += '<h2>Comments</h2>'
    for (let i = 0; i < 3 && i < item.kids.length; i++) {
      let comment = await hn(item.kids[i])
      postscript += '<blockquote>' + comment.text + '<p>&mdash; ' + comment.by + '</blockquote>'
    }
    url = item.url
  }

  url = url.replace('#!', '?_escaped_fragment_=')

  let dom = await jsdom(url, allowLocal)
  if (dom === null) return null

  let {title, author, date, content} = await preprocess(dom.window)
  let md = await postprocess(content + postscript, opts)

  let output = '---\n' + yaml.dump({title}, {lineWidth: 150})
  if (author) output += yaml.dump({author})
  if (date) output += yaml.dump({date})
  if (bytes(md) > 1500) {
    let lang = franc(md)
    if (shortLang[lang]) lang = shortLang[lang]
    output += yaml.dump({lang})
  }
  output += '---\n\n' + md
  return output
}

async function mainURL (url) {
  let opts = process.argv.filter(arg => arg.startsWith('-'))
  let output = await peruse(url, opts)
  if (output) {
    await less(output)
    return 0
  } else {
    console.error(url + ': unrecognised input')
    return 1
  }
}

async function mainDiff (url1, url2) {
  let opts = ['--atx-headers', '--wrap=none']
  let text1 = await peruse(url1, opts)
  let text2 = await peruse(url2, opts)
  text1 = text1.replace(/https:\/\/web.archive.org\/web\/[^/]+\//g, '')
  text2 = text2.replace(/https:\/\/web.archive.org\/web\/[^/]+\//g, '')
  if (text1 === text2) {
    console.error('No changes')
    return 0
  }

  let output = await diff(text1, text2)
  if (!output) output = text1 + '\n\n--\n\n' + text2
  await less(output)
  return 1
}

async function mainHistory (url, until) {
  let opts = ['--atx-headers', '--wrap=none']
  let timestamps = await waybackTimestamps(url)

  let url1 = `https://web.archive.org/web/${timestamps[0]}/${url}`
  let text1 = await peruse(url1, opts)
  text1 = text1.replace(/https:\/\/web.archive.org\/web\/[^/]+\//g, '')

  console.log('# Original', timestamps[0])
  console.log(text1)

  for (let i = 1; i < timestamps.length; i++) {
    const timestamp = timestamps[i]
    if (until && until < timestamp) break
    let url2 = `https://web.archive.org/web/${timestamp}/${url}`
    let text2 = await peruse(url2, opts)
    text2 = text2.replace(/https:\/\/web.archive.org\/web\/[^/]+\//g, '')
    if (text1 === text2) {
      console.error('No changes', timestamp)
      continue
    }

    let output = await diff(text1, text2)
    if (output) {
      console.log('# Update', timestamp)
      console.log(output)
    } else {
      console.log('# Rewrite', timestamp)
      console.log(text2)
    }
    text1 = text2
  }
  return 0
}

async function mainServer (port = 4343) {
  let app = express()
  app.use('/static', express.static(path.join(__dirname, 'static')))
  app.get('/html/:url(*)', async (req, res, next) => {
    try {
      let url = req.params.url
      let qstr = URL.parse(req.url).search
      if (qstr) url += qstr
      let output = await peruse(url, [], false)
      if (output) {
        let html = await pipe('pandoc', output, '--standalone', '--css=/static/peruse.css')
        res.send(html)
      } else {
        res.sendStatus(404)
      }
    } catch (e) {
      next(e)
    }
  })
  app.listen(port, () => console.log(`Server running: http://localhost:${port}/`))
  await sigint()
  console.log('Stopping server')
}

const commands = {
  diff: mainDiff,
  history: mainHistory,
  server: mainServer
}

const main = (cmd, ...args) => (cmd in commands) ? commands[cmd](...args) : mainURL(cmd)

main.apply(null, process.argv.slice(2).filter(arg => !arg.startsWith('-'))).then(code => {
  process.exitCode = code
  setTimeout(process.exit, 100)
})
