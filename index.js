#!/usr/bin/env node
'use strict'
const bytes = require('utf8-length')
const eventToPromise = require('event-to-promise')
const express = require('express')
const {JSDOM} = require('jsdom')
const pandiff = require('pandiff')
const {pandoc} = require('nodejs-sh')
const path = require('path')
const tmp = require('tmp')
const URL = require('url')

const fetch = require('./lib/fetch')
const fetchArticle = require('./lib/fetch-article')
const less = require('./lib/less')
const {waybackTimestamps} = require('./lib/wayback')

const forEachR = (a, f) => { for (let i = a.length - 1; i >= 0; i--) f(a[i]) }

const highlightLanguages = pandoc('--list-highlight-languages').toString().then(s => s.trim().split('\n'))

const markdown = [
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

const HN_URL = 'https://news.ycombinator.com/item?id='
async function hn (id) {
  let response = await fetch('https://hacker-news.firebaseio.com/v0/item/' + id + '.json')
  return response.json()
}

async function peruse (url, opts = [], allowLocal = true) {
  let postscript = ''
  if (url.startsWith(HN_URL)) {
    let item = await hn(url.replace(HN_URL, ''))
    if (item.kids.length > 0) postscript += '<h1>Comments</h1>'
    for (let i = 0; i < 3 && i < item.kids.length; i++) {
      let comment = await hn(item.kids[i])
      postscript += '<blockquote>' + comment.text + '<p>&mdash; ' + comment.by + '</blockquote>'
    }
    url = item.url
  }

  let classesToPreserve = await highlightLanguages
  let html = await fetchArticle(url, {allowLocal, classesToPreserve})
  if (html === null) return null

  html = html.replace('</body></html>', '') + postscript + '</body></html>'
  html = html
    .replace(/<iframe src="(.*?)"><\/iframe>/g, '<figure><img src="$1" /></figure>')
    .replace(/<audio src="(.*?)"><\/audio>/g, '<figure><img src="$1" /></figure>')
    .replace(/<video src="(.*?)"><\/video>/g, '<figure><img src="$1" /></figure>')

  let output = await pandoc('--standalone', '--from=html',
    '--lua-filter', path.join(__dirname, 'pandoc-a11y.lua'),
    '--to=' + markdown + '-smart', '--reference-links').end(html).toString()
  if (bytes(output) > 1500) opts = opts.concat(['--filter', 'pandoc-lang'])
  return pandoc('--standalone', '--from=' + markdown,
    '--to=' + markdown + '-smart', '--reference-links', ...opts).end(output).toString()
}

async function mainURL (url) {
  let opts = process.argv.filter(arg => arg.startsWith('-'))
  let output = await peruse(url, opts)
  return lessMaybe(output, url + ': unrecognised input')
}

async function lessMaybe (output, err, scopeName = 'source.gfm') {
  if (output) {
    await less(output, scopeName)
    return 0
  } else {
    console.error(err)
    return 1
  }
}

async function mainHTML (url) {
  let output = await fetchArticle(url, {
    allowLocal: true,
    classesToPreserve: await highlightLanguages
  })
  return lessMaybe(output, url + ': unrecognised input', 'text.html.basic')
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
  html: mainHTML,
  server: mainServer
}

const main = (cmd, ...args) => (cmd in commands) ? commands[cmd](...args) : mainURL(cmd)

main.apply(null, process.argv.slice(2).filter(arg => !arg.startsWith('-'))).then(code => {
  process.exitCode = code
  setTimeout(process.exit, 100)
})
