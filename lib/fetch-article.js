'use strict'
const chrono = require('chrono-node')
const escapeHTML = require('escape-html')
const {FilterList} = require('cosmetic-filter')
const fs = require('fs')
const {JSDOM, VirtualConsole} = require('jsdom')
const {memoize} = require('lodash')
const PageZipper = require('pagezipper')
const path = require('path')
const prerender = require('prerender')
const {promisify} = require('util')
const querystring = require('querystring')
const Readability = require('readability')
const RSS = require('rss-parser')
const sanitizeHTML = require('sanitize-html')
const srcset = require('srcset')
const {tidy} = require('htmltidy2')
const URL = require('url')

const fetch = require('./fetch')
const sanitizeHTMLConfig = require('./sanitize-html.json')
const {waybackRewrite} = require('./wayback')

require('prerender/lib/util').log = console.error

const trailingPunctuation = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]$/

const forEachR = (a, f) => { for (let i = a.length - 1; i >= 0; i--) f(a[i]) }
const nonempty = node => node.textContent.trim() || node.querySelector('img')
const removeNode = node => node.parentNode.removeChild(node)
const srcsetMax = s => srcset.parse(s).reduce((a, b) => (a.width > b.width || a.density > b.density) ? a : b).url
const stripTag = node => { node.outerHTML = node.innerHTML }

const virtualConsole = new VirtualConsole()
virtualConsole.sendTo(console, {omitJSDOMErrors: true})

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
    let response = await fetch(url)
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
  html = html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[^>]*>\s*<!--[\s\S]+?-->\s*<\/script>/g, '')
  html = await promisify(tidy)(html, {logicalEmphasis: true, wrap: 0})
  return new JSDOM(html, {virtualConsole, url})
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
  {loc = window.location, allowPrerender = true, pgzp = null, classesToPreserve = []} = {}) {
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

  let readability = new Readability(document, {classesToPreserve})
  let parsed = readability.parse()
  if (parsed && parsed.content.replace(/<.*?>/g, '').length > 200) {
    article = parsed
  } else if (allowPrerender && loc.href !== 'about:blank') {
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

async function fetchArticle (url, {allowLocal = false, classesToPreserve = []} = {}) {
  url = url.replace('#!', '?_escaped_fragment_=')
  let dom = await jsdom(url, allowLocal)
  if (dom === null) return null

  let {title, author, date, content} = await preprocess(dom.window, {classesToPreserve})
  let html = `<!DOCTYPE html><html><head><title>${escapeHTML(title)}</title>`
  if (author) html += `<meta name="author" content="${escapeHTML(author)}">`
  if (date) html += `<meta name="date" content="${escapeHTML(date)}">`
  html += `</head><body>${sanitizeHTML(content, sanitizeHTMLConfig)}</body></html>`
  return promisify(tidy)(html, {indent: true, outputXhtml: true, wrap: 0})
}

module.exports = fetchArticle
