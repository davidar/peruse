#!/usr/bin/env node

const escapeHTML = require('escape-html')
const fs = require('fs')
const {JSDOM, VirtualConsole} = require('jsdom')
const prerender = require('prerender')
const r2 = require('r2')
const {Readability} = require('readability/index')
const {spawn, spawnSync} = require('child_process')
const tmp = require('tmp')
const URL = require('url')

const {findNextPageLink} = require('./readability.js')

function removeNode (node) {
  node.parentNode.removeChild(node)
}

function removeNodes (nodes) {
  for (let i = nodes.length - 1; i >= 0; i--) removeNode(nodes[i])
}

function nonempty (node) {
  return node.textContent.trim() || node.querySelector('img')
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

const virtualConsole = new VirtualConsole()
virtualConsole.sendTo(console, {omitJSDOMErrors: true})
const options = {virtualConsole}

let ignoreTitles = false
let postscript = ''
let allowPrerender = true

async function peruse (window, loc) {
  if (loc === undefined) loc = window.location
  let document = window.document

  let base = document.getElementsByTagName('base')[0]
  if (base) {
    base.href = URL.resolve(loc.href, base.href)
  } else {
    base = document.createElement('base')
    base.href = loc.href
    base = document.head.appendChild(base)
  }

  removeNodes(document.body.querySelectorAll('[class*="hidden"]'))

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

  let figs = document.getElementsByTagName('figure')
  for (let i = figs.length - 1; i >= 0; i--) {
    let fig = figs[i]
    if (fig.getElementsByTagName('figcaption').length === 0) {
      fig.outerHTML = '<div>' + fig.innerHTML + '</div>'
    }
  }

  if (ignoreTitles) removeNodes(document.getElementsByTagName('title'))

  let breaks = document.querySelectorAll(
    'h1 br, h2 br, h3 br, h4 br, h5 br, h6 br')
  for (let i = breaks.length - 1; i >= 0; i--) {
    breaks[i].outerHTML = ' '
  }

  let waybackToolbar = document.getElementById('wm-ipp')
  if (waybackToolbar) removeNode(waybackToolbar)

  removeNodes(document.getElementsByClassName('mw-editsection'))

  let span
  while ((span = document.querySelector('span'))) {
    span.outerHTML = span.innerHTML
  }

  let content = document.documentElement.outerHTML

  let nextPageLink = findNextPageLink(loc, document.body)
  if (nextPageLink) {
    links = document.getElementsByTagName('a')
    for (let i = links.length - 1; i >= 0; i--) {
      if (links[i].href === nextPageLink + '/') {
        nextPageLink = nextPageLink + '/'
        break
      }
    }
  }

  let uri = {
    spec: loc.href,
    host: loc.host,
    prePath: loc.protocol + '//' + loc.host,
    scheme: loc.protocol.substr(0, loc.protocol.indexOf(':')),
    pathBase: loc.protocol + '//' + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf('/') + 1)
  }
  let readability = new Readability(uri, document)
  let article = readability.parse()

  if (article && article.content.replace(/<.*?>/g, '').length > 100) {
    content = '<h1>' + escapeHTML(article.title) + '</h1>' + article.content
      .replace(/<(embed|iframe|video|audio) /g, '<img ')
      .replace(/<p style="display: inline;" class="readability-styled">([^<]*)<\/p>/g, '$1')
  } else if (allowPrerender) {
    allowPrerender = false
    console.error('Prerendering...')
    require('prerender/lib/util').log = console.error
    const server = prerender()
    await server.startPrerender()
    let dom = await JSDOM.fromURL('http://localhost:3000/' + loc.href, options)
    await peruse(dom.window, loc)
    server.killBrowser()
    setTimeout(process.exit, 500)
    return
  }

  if (nextPageLink) content += '<p><a href="' + nextPageLink + '">Next Page</a></p>'
  if (!content.includes('<h2')) {
    content = content
      .replace(/<h3>(.*?)<\/h3>/g, '<h2>$1</h2>')
      .replace(/<h4>(.*?)<\/h4>/g, '<h3>$1</h3>')
      .replace(/<h5>(.*?)<\/h5>/g, '<h4>$1</h4>')
      .replace(/<h6>(.*?)<\/h6>/g, '<h5>$1</h5>')
  }
  content += postscript

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
    stdio: ['pipe', 'pipe', process.stderr]
  })

  convert.stdin.end(content)
  convert.stdout.pipe(normalise.stdin)
  if (process.stdout.isTTY) {
    let output = await readStream(normalise.stdout)
    if (output.split(/\n/).length >= process.stdout.rows) {
      let less = spawn('less', [], {
        stdio: ['pipe', process.stdout, process.stderr]
      })
      less.stdin.end(output)
      await waitProcess(less)
    } else {
      process.stdout.write(output)
    }
  } else {
    normalise.stdout.pipe(process.stdout)
    await eof(normalise.stdout)
  }
}

const HN_URL = 'https://news.ycombinator.com/item?id='
async function hn (id) {
  return r2('https://hacker-news.firebaseio.com/v0/item/' + id + '.json').json
}

async function main (url) {
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

  let parsed = URL.parse(url)
  if (parsed.protocol && parsed.hostname) {
    let dom = await JSDOM.fromURL(url, options)
    await peruse(dom.window)
  } else if (url.endsWith('.html') && fs.existsSync(url)) {
    let html = fs.readFileSync(url, 'utf8')
    let dom = new JSDOM(html, options)
    await peruse(dom.window)
  } else {
    console.error(url + ': unrecognised input')
    process.exit(1)
  }
}

main.apply(null, process.argv.slice(2))
