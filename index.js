#!/usr/bin/env node

const escapeHTML = require('escape-html')
const {jsdom} = require('jsdom')
const {Readability} = require('readability/index')
const {spawn, spawnSync} = require('child_process')
const tmp = require('tmp')
const r2 = require('r2')
const {findNextPageLink} = require('./readability.js')

function removeNode (node) {
  node.parentNode.removeChild(node)
}

function nonempty (node) {
  return node.textContent.trim() || node.querySelector('img')
}

let ignoreTitles = false
let postscript = ''

function peruse (window) {
  let document = window.document

  let links = document.getElementsByTagName('a')
  for (let i = links.length - 1; i >= 0; i--) {
    let link = links[i]
    let href = link.getAttribute('href')
    if (href && href[0] === '#') {
      link.removeAttribute('href')
    }
  }

  links = document.querySelectorAll('pre a')
  for (let i = links.length - 1; i >= 0; i--) {
    let link = links[i]
    link.outerHTML = link.innerHTML
  }

  let nodes = document.querySelectorAll('a, em, strong, b, i')
  for (let i = nodes.length - 1; i >= 0; i--) {
    let node = nodes[i]
    if (!nonempty(node)) {
      node.outerHTML = node.innerHTML
    }
  }

  let images = document.getElementsByTagName('img')
  for (let i = images.length - 1; i >= 0; i--) {
    let image = images[i]
    if (image.getAttribute('src') === '') {
      removeNode(image)
    }
  }

  let tables = document.getElementsByTagName('table')
  for (let i = tables.length - 1; i >= 0; i--) {
    let table = tables[i]
    if (table.rows.length === 1 && table.rows[0].cells.length === 1) {
      table.outerHTML = table.rows[0].cells[0].innerHTML
    }
  }

  let items = document.getElementsByTagName('li')
  for (let i = items.length - 1; i >= 0; i--) {
    items[i].removeAttribute('id')
  }

  let codes = document.getElementsByTagName('code')
  for (let i = codes.length - 1; i >= 0; i--) {
    let code = codes[i]
    if (code.textContent.split('\n').length > 2) {
      code.outerHTML = '<pre>' + code.outerHTML + '</pre>'
    }
  }

  let svgs = document.getElementsByTagName('svg')
  for (let i = svgs.length - 1; i >= 0; i--) {
    let svg = svgs[i]
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    let dataURI = 'data:image/svg+xml,' + encodeURIComponent(svg.outerHTML)
    svg.outerHTML = '<img src="' + dataURI + '" />'
  }

  let figs = document.getElementsByTagName('figure')
  for (let i = figs.length - 1; i >= 0; i--) {
    let fig = figs[i]
    if (fig.getElementsByTagName('figcaption').length === 0) {
      fig.outerHTML = '<div>' + fig.innerHTML + '</div>'
    }
  }

  if (ignoreTitles) {
    let titles = document.getElementsByTagName('title')
    for (let i = titles.length - 1; i >= 0; i--) removeNode(titles[i])
  }

  let breaks = document.querySelectorAll(
    'h1 br, h2 br, h3 br, h4 br, h5 br, h6 br')
  for (let i = breaks.length - 1; i >= 0; i--) {
    breaks[i].outerHTML = ' '
  }

  let waybackToolbar = document.getElementById('wm-ipp')
  if (waybackToolbar) removeNode(waybackToolbar)

  let mwEdits = document.getElementsByClassName('mw-editsection')
  for (let i = mwEdits.length - 1; i >= 0; i--) {
    removeNode(mwEdits[i])
  }

  let span
  while ((span = document.querySelector('span'))) {
    span.outerHTML = span.innerHTML
  }

  let content = document.documentElement.outerHTML

  let nextPageLink = findNextPageLink(window, document.body)
  if (nextPageLink) {
    links = document.getElementsByTagName('a')
    for (let i = links.length - 1; i >= 0; i--) {
      if (links[i].href === nextPageLink + '/') {
        nextPageLink = nextPageLink + '/'
        break
      }
    }
  }

  let loc = document.location
  let uri = {
    spec: loc.href,
    host: loc.host,
    prePath: loc.protocol + '//' + loc.host,
    scheme: loc.protocol.substr(0, loc.protocol.indexOf(':')),
    pathBase: loc.protocol + '//' + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf('/') + 1)
  }
  let readability = new Readability(uri, document)
  let article = readability.parse()

  if (article) {
    content = '<h1>' + escapeHTML(article.title) + '</h1>'
    content += article.content.replace(
      /<(embed|iframe|video|audio) /g, '<img ').replace(
      /<p style="display: inline;" class="readability-styled">([^<]*)<\/p>/g, '$1')
    if (nextPageLink) content += '<p><a href="' + nextPageLink + '">Next Page</a></p>'
    content += postscript
  }

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

  let convert = spawn('pandoc', [
    '-f', 'html',
    '-t', markdown + '-smart',
    '--reference-links'
  ], {
    stdio: ['pipe', 'pipe', process.stderr]
  })

  let normalise = spawn('pandoc', [
    '-f', markdown,
    '-t', markdown + '-smart',
    '--reference-links'
  ].concat(process.argv.slice(3)), {
    stdio: ['pipe', process.stdout, process.stderr]
  })

  convert.stdin.end(content)
  convert.stdout.pipe(normalise.stdin)
}

const HN_URL = 'https://news.ycombinator.com/item?id='
async function hn (id) {
  return r2('https://hacker-news.firebaseio.com/v0/item/' + id + '.json').json
}

async function main () {
  let url = process.argv[2]
  if (url.endsWith('.pdf')) {
    let tmpdir = tmp.dirSync().name
    spawnSync('pdftohtml', ['-c', '-s', '-i', url, tmpdir + '/out'], {stdio: 'ignore'})
    url = tmpdir + '/out-html.html'
    ignoreTitles = true
  }

  if (url.startsWith(HN_URL)) {
    let item = await hn(url.replace(HN_URL, ''))
    if (item.kids.length > 0) postscript += '<h2>Comments</h2>'
    for (let i = 0; i < 3 && i < item.kids.length; i++) {
      let comment = await hn(item.kids[i])
      postscript += '<blockquote>' + comment.text + '<p>&mdash; ' + comment.by + '</blockquote>'
    }
    url = item.url
  }

  jsdom.env(url, [], function (err, window) {
    if (err) { console.error(err) } else { peruse(window) }
  })
}

main()
