'use strict'
import lodash from 'lodash'
import querystring from 'querystring'

import fetch from './fetch.js'

export const timestamps = lodash.memoize(async (url) => {
  const cdx = 'https://web.archive.org/cdx/search/cdx?' + querystring.stringify({
    fl: 'timestamp',
    filter: 'statuscode:200',
    collapse: 'digest',
    url
  })
  let resp = await fetch(cdx)
  resp = await resp.text()
  if (!resp.trim()) return null
  return resp.trim().split('\n')
})

export async function rewrite (url) {
  const match = url.match(/^https:\/\/web.archive.org\/web\/([0-9]+)\/(.*)/)
  if (match) {
    url = match[2]
    const timestamp = match[1]
    const timestamps = await module.exports.timestamps(url)
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
