#!/usr/bin/env node

const escapeHTML = require('escape-html')
const fs = require('fs')
const {JSDOM, VirtualConsole} = require('jsdom')
const path = require('path')
const prerender = require('prerender')
const querystring = require('querystring')
const r2 = require('r2')
const {Readability} = require('readability/index')
const {spawn} = require('child_process')
const tldjs = require('tldjs')
const tmp = require('tmp')
const URL = require('url')

const {findNextPageLink} = require('./readability.js')

require('prerender/lib/util').log = console.error

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
  return new Promise(function (resolve, reject) {
    proc.on('close', function (code) {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`child process exited with code ${code}`))
      }
    })
  })
}

async function eof (stream) {
  return new Promise(function (resolve, reject) {
    stream.on('end', resolve)
    stream.on('error', reject)
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

let waybackTimestampsCache = {}
async function waybackTimestamps (url) {
  if (waybackTimestampsCache[url]) return waybackTimestampsCache[url]
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
  waybackTimestampsCache[url] = resp.trim().split('\n')
  return waybackTimestampsCache[url]
}

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

async function jsdom (url) {
  let parsed = URL.parse(url)
  if (parsed.protocol && parsed.hostname) return fromURL(url)
  if (url.endsWith('.html') && fs.existsSync(url)) {
    let html = fs.readFileSync(url, 'utf8')
    return new JSDOM(html, optionsJSDOM)
  }
  return null
}

async function preprocess (window,
  {loc = window.location, allowPrerender = true, pages = 1, lastPageScore = 0} = {}) {
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
    if (!nonempty(node)) node.outerHTML = node.innerHTML
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

  let content = document.documentElement.outerHTML

  let {href: nextPageLink, score: nextPageScore} = findNextPageLink(loc, document.body) || {}
  if (nextPageLink) {
    forEachR(document.getElementsByTagName('a'), link => {
      if (link.href === nextPageLink + '/') nextPageLink = link.href
    })
    if ((pages === 1 && !nextPageLink.startsWith(loc.href)) ||
        nextPageScore < lastPageScore - 50) {
      console.error('Skipping inconsistent next page link', nextPageLink)
      nextPageLink = null
    }
  }

  let readability = new Readability(null, document)
  let article = readability.parse()

  if (article && article.content.replace(/<.*?>/g, '').length > 200) {
    content = ''
    if (pages === 1) content += '<h1>' + escapeHTML(article.title) + '</h1>'
    content += article.content
      .replace(/<(embed|iframe|video|audio) /g, '<img ')
      .replace(/<p style="display: inline;" class="readability-styled">([^<]*)<\/p>/g, '$1')
  } else if (allowPrerender) {
    const server = prerender()
    await server.startPrerender()
    let dom = await fromURL('http://localhost:3000/render?' + querystring.stringify({
      url: loc.href,
      renderType: 'html',
      followRedirects: true,
      javascript: ''
    }))
    content = await preprocess(dom.window, {loc, allowPrerender: false, pages})
    server.killBrowser()
  }

  if (!content.includes('<h2')) {
    content = content
      .replace(/<h3>(.*?)<\/h3>/g, '<h2>$1</h2>')
      .replace(/<h4>(.*?)<\/h4>/g, '<h3>$1</h3>')
      .replace(/<h5>(.*?)<\/h5>/g, '<h4>$1</h4>')
      .replace(/<h6>(.*?)<\/h6>/g, '<h5>$1</h5>')
  }

  if (nextPageLink && pages < 10) {
    console.error(`Fetching page ${pages + 1} from ${nextPageLink}`)
    let dom = await fromURL(nextPageLink)
    content += await preprocess(dom.window, {pages: pages + 1, lastPageScore: nextPageScore})
  } else if (nextPageLink) {
    content += '<p><a href="' + nextPageLink + '">Next Page</a></p>'
  }

  return content
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

const HN_URL = 'https://news.ycombinator.com/item?id='
async function hn (id) {
  return r2('https://hacker-news.firebaseio.com/v0/item/' + id + '.json').json
}

async function main (url, url2) {
  if (url2) {
    let opts = ['--atx-headers', '--wrap=none']
    let text1 = await postprocess(await preprocess((await jsdom(url)).window), opts)
    let text2 = await postprocess(await preprocess((await jsdom(url2)).window), opts)
    text1 = text1.replace(/https:\/\/web.archive.org\/web\/[^/]+\//g, '')
    text2 = text2.replace(/https:\/\/web.archive.org\/web\/[^/]+\//g, '')
    let tmpdir = tmp.dirSync().name
    fs.writeFileSync(path.join(tmpdir, 'a.md'), text1)
    fs.writeFileSync(path.join(tmpdir, 'b.md'), text2)
    let dwdiff = spawn('dwdiff', [
      '--aggregate-changes',
      '--algorithm=best',
      '--context=1',
      '--delimiters=‘’“”',
      '--repeat-markers',
      path.join(tmpdir, 'a.md'),
      path.join(tmpdir, 'b.md')])
    let output = await readStream(dwdiff.stdout)
    output = output.replace(/\[--\]/g, '').replace(/\{\+\+\}/g, '')
    if (output.trim()) await less(output); else console.error('No changes')
    return 0
  }

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

  let dom = await jsdom(url)
  if (dom === null) {
    console.error(url + ': unrecognised input')
    return 1
  }

  let content = await preprocess(dom.window)
  content += postscript

  let opts = process.argv.filter(arg => arg.startsWith('-'))
  let output = await postprocess(content, opts)
  await less(output)

  setTimeout(process.exit, 100)
  return 0
}

main.apply(null, process.argv.slice(2).filter(arg => !arg.startsWith('-')))
  .then(function (code) { process.exitCode = code })
