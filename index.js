#!/usr/bin/env node
'use strict'
const bytes = require('utf8-length')
const chalk = require('chalk')
const chrono = require('chrono-node')
const escapeHTML = require('escape-html')
const eventToPromise = require('event-to-promise')
const express = require('express')
const fetch = require('node-fetch')
const {FilterList} = require('cosmetic-filter')
const fs = require('fs')
const Highlights = require('highlights')
const {JSDOM, VirtualConsole} = require('jsdom')
const {memoize} = require('lodash')
const PageZipper = require('pagezipper')
const pandiff = require('pandiff')
const {pandoc} = require('nodejs-sh')
const parse5 = require('parse5')
const path = require('path')
const prerender = require('prerender')
const querystring = require('querystring')
const Readability = require('readability')
const retry = require('async-retry')
const RSS = require('rss-parser')
const sanitizeHTML = require('sanitize-html')
const {spawn} = require('child_process')
const {timeout} = require('promise-timeout')
const tmp = require('tmp')
const URL = require('url')

require('prerender/lib/util').log = console.error

const trailingPunctuation = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]$/

const forEachR = (a, f) => { for (let i = a.length - 1; i >= 0; i--) f(a[i]) }
const nonempty = node => node.textContent.trim() || node.querySelector('img')
const removeNode = node => node.parentNode.removeChild(node)
const stripTag = node => { node.outerHTML = node.innerHTML }

const highlightFormat = {
  addition: chalk.green,
  bold: chalk.bold,
  comment: chalk.gray,
  deleted: chalk.red,
  deletion: chalk.red,
  'front-matter': chalk.bold,
  heading: chalk.bold,
  inserted: chalk.green,
  italic: chalk.italic,
  'key-value': chalk.gray,
  link: chalk.blueBright,
  strike: chalk.strikethrough,
  substitution: chalk.yellow,
  tag: chalk.gray,
  underline: chalk.underline,
  line: s => s + '\n'
}

function highlightNode (node) {
  if (node.type === 'text') return node.data
  let content = node.childNodes.map(highlightNode).join('')
  let classes = node.attribs.class ? node.attribs.class.split(' ') : []
  for (const cls of classes) {
    if (cls in highlightFormat) content = highlightFormat[cls](content)
  }
  return content
}

function highlight (fileContents, scopeName = 'source.gfm') {
  let highlighter = new Highlights()
  highlighter.requireGrammarsSync({
    modulePath: require.resolve('./language-gfm/package.json')
  })
  let html = highlighter.highlightSync({fileContents, scopeName})
  return parse5.parseFragment(html, {
    treeAdapter: parse5.treeAdapters.htmlparser2
  }).childNodes.map(highlightNode).join('')
}

async function less (output) {
  if (process.stdout.isTTY) output = highlight(output)
  if (process.stdout.isTTY && output.split(/\n/).length >= process.stdout.rows) {
    let less = spawn('less', [], {
      stdio: ['pipe', process.stdout, process.stderr]
    })
    less.stdin.end(output)
    await eventToPromise(less, 'close')
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

const fetchRobust = url => retry(async bail => {
  let promise = fetch(url, {headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  }})
  promise = timeout(promise, 15000)
  let response = await promise
  if (response.status === 403) bail(new Error(response.statusText))
  else return response
}, {onRetry: console.error})

const waybackTimestamps = memoize(async (url) => {
  let cdx = 'https://web.archive.org/cdx/search/cdx?' + querystring.stringify({
    fl: 'timestamp',
    filter: 'statuscode:200',
    collapse: 'digest',
    url
  })
  let resp = await fetchRobust(cdx)
  resp = await resp.text()
  if (!resp.trim()) return null
  return resp.trim().split('\n')
})

const virtualConsole = new VirtualConsole()
virtualConsole.sendTo(console, {omitJSDOMErrors: true})

async function waybackRewrite (url) {
  let match = url.match(/^https:\/\/web.archive.org\/web\/([0-9]+)\/(.*)/)
  if (match) {
    url = match[2]
    let timestamp = match[1]
    let timestamps = await waybackTimestamps(url)
    if (timestamps === null) {
      console.error('Page not archived:', url)
      return null
    }
    let i = timestamps.findIndex(t => t > timestamp)
    if (i > 0) i--; else if (i < 0) i = timestamps.length - 1
    url = `https://web.archive.org/web/${timestamps[i]}/${url}`
    if (timestamp !== timestamps[i]) console.error('Rewriting to', url)
  }
  return url
}

async function rss2html (rss) {
  let feed = await new RSS().parseString(rss)
  let html = `<html><head><title>${escapeHTML(feed.title)}</title></head><body><ul>`
  feed.items.forEach(item => {
    html += `<li><a href="${escapeHTML(item.link)}">${escapeHTML(item.title)}</a></li>`
  })
  html += '</ul></body></html>'
  return html
}

async function jsdom (url, allowLocal = false) {
  let html
  let parsed = URL.parse(url)
  if (parsed.protocol && parsed.hostname) {
    url = await waybackRewrite(url)
    if (url === null) return null
    let response = await fetchRobust(url)
    url = response.url
    html = await response.text()
    if (response.headers.get('Content-Type').match(/^application\/(atom\+|rss\+|)xml/)) {
      html = await rss2html(html)
    }
  } else if (allowLocal && url.endsWith('.html') && fs.existsSync(url)) {
    html = fs.readFileSync(url, 'utf8')
    url = undefined
  } else {
    return null
  }
  return new JSDOM(html.replace(/<style[\s\S]*?<\/style>/g, ''), {virtualConsole, url})
}

const prerenderServer = memoize(async () => {
  let server = prerender()
  await server.startPrerender()
  process.on('exit', () => server.killBrowser())
  return 'http://localhost:3000/render?'
})

function preprocessImages (document) {
  forEachR(document.getElementsByTagName('img'), image => {
    if (image.src) image.src = image.src // make absolute
    if (image.hasAttribute('data-src')) {
      let src = image.getAttribute('data-src')
      if (src && !src.startsWith('{')) image.src = src
    }
    if (image.hasAttribute('data-native-src')) image.src = image.getAttribute('data-native-src')
    if (image.hasAttribute('srcset')) image.src = srcsetMax(image.srcset)
    if (!image.hasAttribute('alt') && image.hasAttribute('title')) image.alt = image.title
    if (image.src === '' || image.width === 1) removeNode(image)
  })

  forEachR(document.getElementsByTagName('picture'), picture => {
    let src = null
    forEachR(picture.getElementsByTagName('source'), source => {
      if (source.media && source.media.includes('max-width')) {
        // skip
      } else if (source.hasAttribute('srcset')) {
        src = source.srcset
      } else if (source.hasAttribute('data-srcset')) {
        src = source.getAttribute('data-srcset')
      }
    })
    if (src.includes(' ')) src = srcsetMax(src)
    picture.outerHTML = `<img src="${src}">`
  })

  forEachR(document.getElementsByTagName('figure'), figure => {
    let images = figure.getElementsByTagName('img')
    let caption = figure.getElementsByTagName('figcaption')[0]
    if (images.length > 0) {
      let image = images[0]
      figure.innerHTML = image.outerHTML
      if (caption) {
        figure.innerHTML += caption.outerHTML
      } else if (image.hasAttribute('alt')) {
        figure.innerHTML += `<figcaption>${escapeHTML(image.alt)}</figcaption>`
      }
    } else {
      removeNode(figure)
    }
  })
}

async function preprocess (window,
  {loc = window.location, allowPrerender = true, pgzp = null} = {}) {
  let document = window.document

  if (loc.href === 'about:blank') { // try to find location in document metadata
    let canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) {
      loc = URL.parse(canonical.href)
    } else {
      let ogURL = document.querySelector('meta[property="og:url"]')
      if (ogURL) loc = URL.parse(ogURL.content)
    }
  }

  if (document.getElementsByTagName('base').length > 0) {
    let base = document.getElementsByTagName('base')[0]
    base.href = URL.resolve(loc.href, base.href)
  } else {
    let base = document.createElement('base')
    base.href = loc.href
    document.head.appendChild(base)
  }

  let filterList = new FilterList()
  filterList.loadEasyList(rule => rule.includes("'") ? null : rule) // jsdom#2204
  filterList.load(path.join(__dirname, 'filterlist.txt'))
  filterList.filter(document.body,
    loc.href.replace(/^https:\/\/web.archive.org\/web\/[^/]+\//g, ''))

  preprocessImages(document)

  forEachR(document.getElementsByTagName('a'), link => {
    let href = link.getAttribute('href')
    if (href && href.match(/^(#|javascript:)/)) {
      link.removeAttribute('href') // keep <a> tag for readability heuristics
    } else if (href) {
      link.href = link.href // make absolute
    }
  })

  // trim whitespace from formatting
  forEachR(document.querySelectorAll('a, b, em, i, strong'), node => {
    if (nonempty(node)) {
      let prep = /^\s/.test(node.innerHTML) ? ' ' : ''
      let post = /\s$/.test(node.innerHTML) ? ' ' : ''
      node.innerHTML = node.innerHTML.trim()
      node.outerHTML = prep + node.outerHTML + post
    } else {
      stripTag(node)
    }
  })

  // retain linebreaks in code
  forEachR(document.getElementsByTagName('code'), code => {
    if (code.textContent.trim().split('\n').length > 1) {
      code.outerHTML = `<pre>${code.outerHTML}</pre>`
    }
  })

  // remove single cell tables
  forEachR(document.getElementsByTagName('table'), table => {
    if (table.rows.length === 1 && table.rows[0].cells.length === 1) {
      table.outerHTML = table.rows[0].cells[0].innerHTML
    }
  })

  let article = {
    title: document.title,
    content: document.body.innerHTML
  }

  if (!pgzp) pgzp = new PageZipper(loc.href)
  let nextPage = pgzp.getNextLink(document.body) || {}
  if (nextPage.url) {
    let lastPage = pgzp.pages[pgzp.pages.length - 1]
    if ((pgzp.pages.length === 1 && !nextPage.url.replace('www.', '').startsWith(loc.href.replace('www.', ''))) ||
        nextPage.finalScore < 0.8 * lastPage.finalScore || nextPage.finalScore < 15e3) {
      console.error('Skipping inconsistent next page link', nextPage.url)
      nextPage.url = null
    } else {
      pgzp.addNextLink(nextPage)
    }
  }

  let langs = (await pandoc('--list-highlight-languages').toString()).trim().split('\n')
  let readability = new Readability(document, {classesToPreserve: langs})
  let parsed = readability.parse()
  if (parsed && parsed.content.replace(/<.*?>/g, '').length > 200) {
    article = parsed
  } else if (allowPrerender) {
    let server = await prerenderServer()
    let dom = await jsdom(server + querystring.stringify({
      url: loc.href,
      renderType: 'html',
      followRedirects: true,
      javascript: ''
    }))
    article = await preprocess(dom.window, {loc, allowPrerender: false, pgzp})
  }

  article.title = article.title.replace(/\s+/g, ' ')
  if (article.byline) {
    article.author = article.byline.replace(/\s+/g, ' ').replace(/^by /i, '')
    let dates = chrono.parse(article.author)
    if (dates.length > 0) {
      article.date = dates[0].text
      article.author = article.author.replace(article.date, '')
    }
    article.author = article.author.trim().replace(trailingPunctuation, '').trim()
  }

  article.content = article.content.replace(/<p style="display: inline;" class="readability-styled">([^<]*)<\/p>/g, '$1')

  if (article.content.replace(/<pre[\s\S]*?<\/pre>/g, '').length > article.content.length / 10) {
    article.content = article.content.replace(/<pre>/g, '<pre class="highlight">')
  }

  if (nextPage.url && pgzp.pages.length < 10) {
    console.error(`Fetching page ${pgzp.pages.length} from ${nextPage.url}`)
    let dom = await jsdom(nextPage.url)
    if (dom) {
      let rest = await preprocess(dom.window, {pgzp})
      // TODO: remove repeated content
      article.content += rest.content
    }
  } else if (nextPage.url) {
    article.content += '<p><a href="' + nextPage.url + '">Next Page</a></p>'
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
    '-native_divs',
    '-native_spans',
    '-raw_html'
  ].join('')
  let output = await pandoc('--standalone', '--from=html',
    '--lua-filter', path.join(__dirname, 'pandoc-a11y.lua'),
    '--to=' + markdown + '-smart', '--reference-links').end(content).toString()
  if (bytes(output) > 1500) opts = opts.concat(['--filter', 'pandoc-lang'])
  return pandoc('--standalone', '--from=' + markdown,
    '--to=' + markdown + '-smart', '--reference-links', ...opts).end(output).toString()
}

const HN_URL = 'https://news.ycombinator.com/item?id='
async function hn (id) {
  let response = await fetchRobust('https://hacker-news.firebaseio.com/v0/item/' + id + '.json')
  return response.json()
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

  content = sanitizeHTML(content, {
    allowedTags: [
      'a',
      'audio',
      'b',
      'blockquote',
      'br',
      'code',
      'em',
      'figcaption',
      'figure',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'i',
      'iframe',
      'img',
      'li',
      'ol',
      'p',
      'pre',
      'q',
      'strike',
      'strong',
      'sub',
      'sup',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'tt',
      'ul',
      'video'
    ],
    allowedAttributes: {
      a: ['href'],
      audio: ['src'],
      iframe: ['src'],
      img: ['alt', 'src'],
      pre: ['class'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      video: ['src']
    },
    selfClosing: ['br', 'hr', 'img'],
    allowedSchemes: ['about', 'ftp', 'http', 'https', 'mailto'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: true,
    allowedIframeHostnames: [
      'www.youtube.com',
      'www.youtube-nocookie.com',
      'player.vimeo.com',
      'www.dailymotion.com'
    ]
  })

  content = content
    .replace(/<iframe src="(.*?)"><\/iframe>/g, '<figure><img src="$1" /></figure>')
    .replace(/<audio src="(.*?)"><\/audio>/g, '<figure><img src="$1" /></figure>')
    .replace(/<video src="(.*?)"><\/video>/g, '<figure><img src="$1" /></figure>')

  let html = `<!DOCTYPE html><html><head><title>${escapeHTML(title)}</title>`
  if (author) html += `<meta name="author" content="${escapeHTML(author)}">`
  if (date) html += `<meta name="date" content="${escapeHTML(date)}">`
  html += `</head><body>${content}${postscript}</body></html>`

  return postprocess(html, opts)
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

  let diffOpts = {threshold: 0.5}
  if (process.argv.includes('--wrap=none')) diffOpts.wrap = null
  let output = await pandiff(text1, text2, diffOpts)
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

    let diffOpts = {threshold: 0.5}
    if (process.argv.includes('--wrap=none')) diffOpts.wrap = null
    let output = await pandiff(text1, text2, diffOpts)
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

function rewriteLinks (html, format) {
  let dom = new JSDOM(html)
  let body = dom.window.document.body
  forEachR(body.getElementsByTagName('a'), link => {
    if (link.hasAttribute('href')) link.href = `/${format}/${link.href}`
  })
  forEachR(body.getElementsByTagName('img'), image => {
    image.src = '/image/1x/' + image.src
  })
  forEachR(body.querySelectorAll('p>img'), image => {
    let par = image.parentNode
    if (!par.textContent.trim()) par.outerHTML = '<figure>' + image.outerHTML + '</figure>'
  })
  return dom.serialize()
}

async function mainServer (port = 4343) {
  let opts = process.argv.filter(arg => arg.startsWith('-') && arg !== '--unsafe-local')
  const pandocFormats = (await pandoc('--list-output-formats').toString()).trim().split('\n')
  let app = express()
  app.use('/static', express.static(path.join(__dirname, 'static')))
  app.get('/image/:opt/:url(*)', (req, res) => {
    let {opt, url} = req.params
    let qstr = URL.parse(req.url).search
    if (qstr && !url.includes('imgix.net')) url += qstr
    if (opt === '1x') res.redirect(url)
  })
  app.get('/:format/:url(*)', async (req, res, next) => {
    try {
      let {format, url} = req.params
      let qstr = URL.parse(req.url).search
      if (qstr) url += qstr
      let output = await peruse(url, opts, process.argv.includes('--unsafe-local'))
      if (!output) return res.sendStatus(404)

      if (['text', 'markdown', 'md'].includes(format)) {
        res.type(format).send(output)
      } else if (format === 'html') {
        let html = await pandoc('--standalone', '--css=/static/peruse.css').end(output).toString()
        html = rewriteLinks(html, format)
        res.send(html)
      } else if (format === 'pdf') {
        let tmpDir = tmp.dirSync({unsafeCleanup: true})
        let tmpFile = path.join(tmpDir.name, 'out.pdf')
        await pandoc('-o', tmpFile).end(output)
        res.sendFile(tmpFile, err => {
          tmpDir.removeCallback()
          if (err) next(err)
        })
      } else if (pandocFormats.includes(format)) {
        output = await pandoc('-t', format, '--reference-links', '--standalone').end(output).toString()
        res.type('text').send(output)
      } else {
        res.sendStatus(404)
      }
    } catch (e) {
      next(e)
    }
  })
  app.listen(port, () => console.log(`Server running: http://localhost:${port}/`))
  await eventToPromise(process, 'SIGINT')
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
