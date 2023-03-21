import fetch from 'node-fetch'
import retry from 'async-retry'
import { timeout } from 'promise-timeout'

export default url => retry(async bail => {
  let promise = fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }
  })
  promise = timeout(promise, 15000)
  const response = await promise
  if (response.status === 403) bail(new Error(response.statusText))
  else return response
}, { onRetry: console.error })
