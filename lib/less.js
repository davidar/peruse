import chalk from 'chalk'
import eventToPromise from 'event-to-promise'
import Highlights from 'highlights'
import * as parse5 from 'parse5'
import { spawn } from 'child_process'
import { createRequire } from 'node:module'

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
  const classes = node.attribs.class ? node.attribs.class.split(' ') : []
  for (const cls of classes) {
    if (cls in highlightFormat) content = highlightFormat[cls](content)
  }
  return content
}

function highlight (fileContents, scopeName = 'source.gfm') {
  const highlighter = new Highlights()
  const require = createRequire(import.meta.url)
  highlighter.requireGrammarsSync({
    modulePath: require.resolve('../language-gfm/package.json')
  })
  const html = highlighter.highlightSync({ fileContents, scopeName })
  return parse5.parseFragment(html, {
  //  treeAdapter: parse5.treeAdapters.htmlparser2
  }).childNodes.map(highlightNode).join('')
}

export default async function less (output, scopeName = 'source.gfm') {
  if (process.stdout.isTTY) output = highlight(output, scopeName)
  if (process.stdout.isTTY && output.split(/\n/).length >= process.stdout.rows) {
    const less = spawn('less', [], {
      stdio: ['pipe', process.stdout, process.stderr]
    })
    less.stdin.end(output)
    await eventToPromise(less, 'close')
  } else {
    process.stdout.write(output)
  }
}
