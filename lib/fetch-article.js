import * as chrono from 'chrono-node'
import escapeHTML from 'escape-html'
import fs from 'fs'
import { JSDOM, VirtualConsole } from 'jsdom'
// import lodash from 'lodash'
import PageZipper from 'pagezipper'
import path from 'path'
// import prerender from 'prerender'
import { promisify } from 'util'
// import querystring from 'querystring'
import { Readability } from 'readability'
import RSS from 'rss-parser'
import sanitizeHTML from 'sanitize-html'
import * as srcset from 'srcset'
import { tidy } from 'htmltidy2'
import { URL } from 'url'

import fetch from './fetch.js'
import sanitizeHTMLConfig from './sanitize-html.json' assert { type: 'json' }
import * as wayback from './wayback.js'

// require('prerender/lib/util').log = console.error

const trailingPunctuation = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]$/

const basenameURL = url => path.basename(new URL(url).pathname)
const forEachR = (a, f) => { for (let i = a.length - 1; i >= 0; i--) f(a[i]) }
const nonempty = node => node.textContent.trim() || node.querySelector('img')
const removeNode = node => node.parentNode.removeChild(node)
const srcsetMax = s => srcset.parse(s).reduce((a, b) => (a.width > b.width || a.density > b.density) ? a : b).url
const stripTag = node => { node.outerHTML = node.innerHTML }

const virtualConsole = new VirtualConsole()
virtualConsole.sendTo(console, { omitJSDOMErrors: true })

async function rss2html (rss) {
  const feed = await new RSS().parseString(rss)
  let html = `<html><head><title>${escapeHTML(feed.title)}</title></head><body><ul>`
  feed.items.forEach(item => {
    html += `<li><a href="${escapeHTML(item.link)}">${escapeHTML(item.title)}</a></li>`
  })
  html += '</ul></body></html>'
  return html
}

async function jsdom (url, allowLocal = false) {
  let html
  const parsed = new URL(url)
  if (parsed.protocol && parsed.hostname) {
    url = await wayback.rewrite(url)
    if (url === null) return null
    const response = await fetch(url)
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
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/g, (match, p1) => // retain linebreaks in code
      (p1.trim().split('\n').length > 1) ? `<pre>${match}</pre>` : match)
  html = await promisify(tidy)(html, { logicalEmphasis: true, wrap: 0 })
  return new JSDOM(html, { virtualConsole, url })
}

/*
const prerenderServer = lodash.memoize(async () => {
  const server = prerender()
  await server.startPrerender()
  process.on('exit', () => server.killBrowser())
  return 'http://localhost:3000/render?'
})
*/

function processImages (html, url) {
  const dom = new JSDOM(html, { url })
  const document = dom.window.document

  forEachR(document.getElementsByTagName('img'), image => {
    if (image.hasAttribute('srcset')) image.src = srcsetMax(image.srcset)
    if (!image.hasAttribute('alt') && image.hasAttribute('title')) image.alt = image.title
  })

  forEachR(document.getElementsByTagName('picture'), picture => {
    let src = null
    forEachR(picture.getElementsByTagName('source'), source => {
      if (!(source.media && source.media.includes('max-width')) && source.hasAttribute('srcset')) {
        src = source.getAttribute('srcset')
      }
    })
    if (src.includes(' ')) src = srcsetMax(src)
    picture.outerHTML = `<img src="${src}">`
  })

  forEachR(document.querySelectorAll('p > img:only-child'), image => {
    const p = image.parentNode
    if (!p.textContent.trim()) p.outerHTML = `<figure>${p.innerHTML}</figure>`
  })

  forEachR(document.querySelectorAll('p > a:only-child > img:only-child'), image => {
    const p = image.parentNode.parentNode
    if (!p.textContent.trim()) p.outerHTML = `<figure>${p.innerHTML}</figure>`
  })

  forEachR(document.getElementsByTagName('figure'), figure => {
    const images = figure.getElementsByTagName('img')
    if (images.length === 0) return removeNode(figure)
    const image = images[0]
    if (image.src.startsWith('data:')) return removeNode(figure)
    const figcaption = figure.getElementsByTagName('figcaption')[0]

    let caption = null
    if (figcaption) {
      const p = figcaption.getElementsByTagName('p')[0]
      caption = (p || figcaption).innerHTML
    } else if (image.hasAttribute('alt') && image.alt.trim()) {
      caption = escapeHTML(image.alt)
    }

    if (!image.hasAttribute('alt') && figcaption) {
      image.alt = figcaption.textContent
    }

    if (image.parentNode.tagName.toLowerCase() === 'a' && image.parentNode.hasAttribute('href')) {
      let href = image.parentNode.href
      href = href.replace(/^https:\/\/web.archive.org\/web\/([0-9]+)\/(.*)/, 'https://web.archive.org/web/$1im_/$2')
      if (!href.endsWith('/') &&
          (image.src.startsWith(href.replace(/[.?][^/]*$/, '')) ||
           basenameURL(image.src) === basenameURL(href))) {
        image.src = href
      } else if (caption) {
        caption = `<a href="${escapeHTML(href)}">${caption}</a>`
      }
    }

    figure.innerHTML = image.outerHTML
    if (caption) figure.innerHTML += `<figcaption>${caption}</figcaption>`
  })

  forEachR(document.getElementsByTagName('figcaption'), caption => {
    if (caption.parentNode.tagName.toLowerCase() !== 'figure') removeNode(caption)
  })

  return dom.serialize()
}

async function preprocess (window,
  { loc = window.location, allowPrerender = true, pgzp = null, classesToPreserve = [] } = {}) {
  const document = window.document

  if (loc.href === 'about:blank') { // try to find location in document metadata
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) {
      loc = new URL(canonical.href)
    } else {
      const ogURL = document.querySelector('meta[property="og:url"]')
      if (ogURL) loc = new URL(ogURL.content)
    }
  }
  if (loc.href.startsWith('//')) loc = new URL('http:' + loc.href)

  if (document.getElementsByTagName('base').length > 0) {
    const base = document.getElementsByTagName('base')[0]
    base.href = new URL(loc.href, base.href)
  } else {
    const base = document.createElement('base')
    base.href = loc.href
    document.head.appendChild(base)
  }

  /*
  const filterList = new FilterList()
  filterList.loadEasyList(rule => rule.includes("'") ? null : rule) // jsdom#2204
  filterList.load(path.join(__dirname, 'filterlist.txt'))
  filterList.filter(document.body,
    loc.href.replace(/^https:\/\/web.archive.org\/web\/[^/]+\//g, ''))
  */

  forEachR(document.getElementsByTagName('a'), link => {
    const href = link.getAttribute('href')
    if (href && href.match(/^(#|javascript:)/)) {
      link.removeAttribute('href') // keep <a> tag for readability heuristics
    } else if (href) {
      // link.href = link.href // make absolute
    }
  })

  // trim whitespace from formatting
  forEachR(document.querySelectorAll('a, b, em, i, strong'), node => {
    if (nonempty(node)) {
      const prep = /^\s/.test(node.innerHTML) ? ' ' : ''
      const post = /\s$/.test(node.innerHTML) ? ' ' : ''
      node.innerHTML = node.innerHTML.trim()
      node.outerHTML = prep + node.outerHTML + post
    } else {
      stripTag(node)
    }
  })

  // lazy-loaded images
  forEachR(document.querySelectorAll('img, source'), image => {
    if (image.hasAttribute('data-src')) {
      const src = image.getAttribute('data-src')
      if (src && !src.startsWith('{')) image.src = src
    }
    if (image.hasAttribute('data-native-src')) image.src = image.getAttribute('data-native-src')
    // if (image.src) image.src = image.src // make absolute
    if (image.hasAttribute('data-srcset')) {
      let srcset = image.getAttribute('data-srcset')
      if (srcset.includes(',') && !srcset.includes(' ')) srcset = srcset.replace(/,/g, '%2C')
      image.srcset = srcset
    }
    if (!image.getAttribute('src') && !image.getAttribute('srcset')) removeNode(image)
  })

  let article = {
    title: document.title,
    content: document.body.innerHTML
  }

  if (!pgzp) pgzp = new PageZipper(loc.href)
  const nextPage = pgzp.getNextLink(document.body) || {}
  if (nextPage.url) {
    const lastPage = pgzp.pages[pgzp.pages.length - 1]
    if ((pgzp.pages.length === 1 && !nextPage.url.replace('www.', '').startsWith(loc.href.replace('www.', ''))) ||
        nextPage.finalScore < 0.8 * lastPage.finalScore || nextPage.finalScore < 15e3) {
      console.error('Skipping inconsistent next page link', nextPage.url)
      nextPage.url = null
    } else {
      pgzp.addNextLink(nextPage)
    }
  }

  const readability = new Readability(document, { classesToPreserve })
  const parsed = readability.parse()
  if (parsed && parsed.content.replace(/<.*?>/g, '').length > 200) {
    article = parsed
  }
  /*
  else if (allowPrerender && loc.href !== 'about:blank') {
    const server = await prerenderServer()
    const dom = await jsdom(server + querystring.stringify({
      url: loc.href,
      renderType: 'html',
      followRedirects: true,
      javascript: ''
    }))
    article = await preprocess(dom.window, { loc, allowPrerender: false, pgzp })
  }
  */

  article.title = article.title.replace(/\s+/g, ' ')
  if (article.byline) {
    article.author = article.byline.replace(/\s+/g, ' ').replace(/^by /i, '')
    const dates = chrono.parse(article.author)
    if (dates.length > 0) {
      article.date = dates[0].text
      article.author = article.author.replace(article.date, '')
    }
    article.author = article.author.trim().replace(trailingPunctuation, '').trim()
  }

  article.url = loc.href

  if (nextPage.url && pgzp.pages.length < 10) {
    console.error(`Fetching page ${pgzp.pages.length} from ${nextPage.url}`)
    const dom = await jsdom(nextPage.url)
    if (dom) {
      const rest = await preprocess(dom.window, { pgzp })
      // TODO: remove repeated content
      article.content += rest.content
    }
  } else if (nextPage.url) {
    article.content += '<p><a href="' + nextPage.url + '">Next Page</a></p>'
  }

  return article
}

export default async function fetchArticle (url, { allowLocal = false, classesToPreserve = [] } = {}) {
  url = url.replace('#!', '?_escaped_fragment_=')
  const dom = await jsdom(url, allowLocal)
  if (dom) {
    const { title, author, date, content, url } = await preprocess(dom.window, { classesToPreserve })
    let html = `<!DOCTYPE html><html><head><title>${escapeHTML(title)}</title>`
    if (author) html += `<meta name="author" content="${escapeHTML(author)}">`
    if (date) html += `<meta name="date" content="${escapeHTML(date)}">`
    html += `</head><body>${sanitizeHTML(content, sanitizeHTMLConfig)}</body></html>`
    html = html.replace(/<a>(.*?)<\/a>/g, '$1')
    html = processImages(html, url)
    return promisify(tidy)(html, { indent: true, outputXhtml: true, wrap: 0 })
  }
}
