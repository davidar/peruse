'use strict'
const chalk = require('chalk')
const eventToPromise = require('event-to-promise')
const Highlights = require('highlights')
const parse5 = require('parse5')
const {spawn} = require('child_process')

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
    modulePath: require.resolve('../language-gfm/package.json')
  })
  let html = highlighter.highlightSync({fileContents, scopeName})
  return parse5.parseFragment(html, {
    treeAdapter: parse5.treeAdapters.htmlparser2
  }).childNodes.map(highlightNode).join('')
}

async function less (output, scopeName = 'source.gfm') {
  if (process.stdout.isTTY) output = highlight(output, scopeName)
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

module.exports = less
