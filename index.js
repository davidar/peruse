#!/usr/bin/env node

const {AdBlockClient, FilterOptions} = require('ad-block')
const bytes = require('utf8-length')
const chalk = require('chalk')
const chrono = require('chrono-node')
const escapeHTML = require('escape-html')
const eventToPromise = require('event-to-promise')
const express = require('express')
const fetch = require('node-fetch')
const franc = require('franc')
const fs = require('fs')
const hljs = require('highlight.js')
const Highlights = require('highlights')
const iso639 = require('iso-639-3')
const {JSDOM, VirtualConsole} = require('jsdom')
const {memoize} = require('lodash')
const pandiff = require('pandiff')
const {pandoc} = require('nodejs-sh')
const parse5 = require('parse5')
const path = require('path')
const prerender = require('prerender')
const querystring = require('querystring')
const Readability = require('readability')
const retry = require('async-retry')
const RSS = require('rss-parser')
const {spawn} = require('child_process')
const {timeout} = require('promise-timeout')
const tldjs = require('tldjs')
const tmp = require('tmp')
const URL = require('url')
const yaml = require('js-yaml')

const {findNextPageLink} = require('./readability.js')

require('prerender/lib/util').log = console.error

const shortLang = {}
for (const {iso6391, iso6393} of iso639) shortLang[iso6393] = iso6391

const trailingPunctuation = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]$/

const forEachR = (a, f) => { for (let i = a.length - 1; i >= 0; i--) f(a[i]) }
const nonempty = node => node.textContent.trim() || node.querySelector('img')
const removeNode = node => node.parentNode.removeChild(node)
const removeNodes = nodes => forEachR(nodes, removeNode)
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

class FilterList {
  constructor () {
    this.classes = new Set()
    this.ids = new Set()
    this.selectors = []
    this.domainSelectors = {}
    this.client = new AdBlockClient()
  }

  load (fname) {
    fname = path.resolve(__dirname, fname)
    let rules = fs.readFileSync(fname, 'ascii')
    for (const line of rules.split('\n')) this.addRule(line)

    fname = fname + '.dat'
    if (fs.existsSync(fname)) {
      this.client.deserialize(fs.readFileSync(fname))
    } else {
      console.error('parsing rules')
      this.client.parse(rules)
      console.error('serialising rules')
      fs.writeFileSync(fname, this.client.serialize())
    }
  }

  addRule (line) {
    if (line.match(/#[@?]#/)) return // TODO: parse exception rules
    let rule = line.split('##') // cosmetic filters
    if (rule.length !== 2) return
    let [domains, selector] = rule

    if (selector.includes("'")) return // jsdom#2204

    if (domains === '') { // generic filter
      if (selector.startsWith('.')) {
        this.classes.add(selector.slice(1))
      } else if (selector.startsWith('#')) {
        this.ids.add(selector.slice(1))
      } else {
        this.selectors.push(selector)
      }
      return
    }

    for (const domain of domains.split(',')) {
      if (!this.domainSelectors[domain]) this.domainSelectors[domain] = []
      this.domainSelectors[domain].push(selector)
    }
  }

  filter (body, domain) {
    forEachR(body.querySelectorAll('[class]'), node => {
      if (Array.from(node.classList).some(c => this.classes.has(c))) removeNode(node)
    })

    forEachR(body.querySelectorAll('[id]'), node => {
      if (this.ids.has(node.id)) removeNode(node)
    })

    for (const selector of this.selectors) {
      try {
        removeNodes(body.querySelectorAll(selector))
      } catch (e) {
        console.error('unable to parse selector:', selector)
      }
    }

    if (this.domainSelectors[domain]) {
      removeNodes(body.querySelectorAll(this.domainSelectors[domain].join()))
    }

    forEachR(body.getElementsByTagName('img'), image => {
      if (this.client.matches(image.src, FilterOptions.image, domain)) removeNode(image)
    })
  }
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

  let domain = tldjs.getDomain(loc.href.replace(/^https:\/\/web.archive.org\/web\/[^/]+\//g, ''))
  let filterList = new FilterList()
  filterList.load('easylist/easylist.txt')
  filterList.load('easylist/fanboy-annoyance.txt')
  filterList.addRule('bloomberg.com##.touts')
  filterList.addRule('independent.co.uk##.type-gallery')
  filterList.addRule('medium.com##.progressiveMedia-thumbnail')
  filterList.addRule('nytimes.com##.hidden')
  filterList.addRule('nytimes.com##.visually-hidden')
  filterList.filter(document.body, domain)

  forEachR(document.getElementsByTagName('a'), link => {
    let href = link.getAttribute('href')
    if (!href) {
      stripTag(link)
    } else if (href.startsWith('#') || href.startsWith('javascript:')) {
      link.removeAttribute('href')
    } else {
      link.href = link.href // make absolute
    }
  })

  forEachR(document.querySelectorAll('pre a'), stripTag)

  forEachR(document.querySelectorAll('a, em, strong, b, i'), node => {
    if (nonempty(node)) {
      let prep = /^\s/.test(node.innerHTML) ? ' ' : ''
      let post = /\s$/.test(node.innerHTML) ? ' ' : ''
      node.innerHTML = node.innerHTML.trim()
      node.outerHTML = prep + node.outerHTML + post
    } else {
      stripTag(node)
    }
  })

  forEachR(document.getElementsByTagName('img'), image => {
    if (image.src) image.src = image.src // make absolute
    if (image.hasAttribute('data-src')) {
      let src = image.getAttribute('data-src')
      if (src && !src.startsWith('{')) image.src = src
    }
    if (image.hasAttribute('data-native-src')) image.src = image.getAttribute('data-native-src')
    if (image.hasAttribute('srcset')) image.src = srcsetMax(image.srcset)
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
      figure.innerHTML = images[0].outerHTML
      if (caption) figure.innerHTML += caption.outerHTML
    } else {
      removeNode(figure)
    }
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

  if (document.body.innerHTML.replace(/<pre[\s\S]*?<\/pre>/g, '').length >
      document.body.innerHTML.length / 10) {
    let langs = (await pandoc('--list-highlight-languages').toString()).trim().split('\n')
    forEachR(document.getElementsByTagName('pre'), pre => {
      if (hljs.listLanguages().includes(pre.className)) return
      let {language, relevance} = hljs.highlightAuto(pre.textContent, langs)
      if (relevance > 25) pre.className = language
      else pre.removeAttribute('class')
    })
  } else { // plain text pretending to be HTML
    forEachR(document.getElementsByTagName('pre'), pre => pre.removeAttribute('class'))
  }

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

  for (let span; (span = document.querySelector('span'));) stripTag(span)

  let article = {
    title: document.title,
    content: document.documentElement.outerHTML
  }

  let {href: nextPageLink, score: nextPageScore} = findNextPageLink(loc, document.body, pages) || {}
  if (nextPageLink) {
    forEachR(document.getElementsByTagName('a'), link => {
      if (link.href === nextPageLink + '/') nextPageLink = link.href
    })
    if ((pages.size === 1 && !nextPageLink.replace('www.', '').startsWith(loc.href.replace('www.', ''))) ||
        nextPageScore < lastPageScore - 50) {
      console.error('Skipping inconsistent next page link', nextPageLink)
      nextPageLink = null
    }
  }

  let readability = new Readability(document)
  readability._postProcessContent = () => {}
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

  let headingRE = /<h([1-6]).*?<\/h.>/g
  let headings = new Set()
  for (let match; (match = headingRE.exec(article.content));) headings.add(match[1])
  headings = Array.from(headings.values()).sort()
  let heading = i => headings.indexOf(i.toString()) + 1
  article.content = article.content
    .replace(/<h2(.*?)<\/h.>/g, `<h${heading(2)}$1</h${heading(2)}>`)
    .replace(/<h3(.*?)<\/h.>/g, `<h${heading(3)}$1</h${heading(3)}>`)
    .replace(/<h4(.*?)<\/h.>/g, `<h${heading(4)}$1</h${heading(4)}>`)
    .replace(/<h5(.*?)<\/h.>/g, `<h${heading(5)}$1</h${heading(5)}>`)
    .replace(/<h6(.*?)<\/h.>/g, `<h${heading(6)}$1</h${heading(6)}>`)

  if (nextPageLink && pages.size < 10) {
    console.error(`Fetching page ${pages.size + 1} from ${nextPageLink}`)
    let dom = await jsdom(nextPageLink)
    if (dom) {
      let rest = await preprocess(dom.window, {pages, lastPageScore: nextPageScore})
      article.content += rest.content
    }
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
    '-native_divs',
    '-native_spans',
    '-raw_html'
  ].join('')
  let output = await pandoc('--from=html',
    '--to=' + markdown + '-smart', '--reference-links').end(content).toString()
  return pandoc('--from=' + markdown,
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

  let diffOpts = process.argv.includes('--wrap=none') ? {wrap: null} : {}
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

    let diffOpts = process.argv.includes('--wrap=none') ? {wrap: null} : {}
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
    if (qstr) url += qstr
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
