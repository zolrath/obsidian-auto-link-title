import { requestUrl, request } from 'obsidian'

function blank(text: string): boolean {
  return text === undefined || text === null || text === ''
}

function notBlank(text: string): boolean {
  return !blank(text)
}

const HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

function extractTitleFromHtml(html: string, url: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Try <title> first
  const titleEl = doc.querySelector('title')
  if (notBlank(titleEl?.innerText)) {
    return titleEl.innerText
  }

  // Fallback: og:title meta tag (often more reliable for SPAs)
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
  if (notBlank(ogTitle)) {
    return ogTitle
  }

  // Fallback: twitter:title
  const twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')
  if (notBlank(twitterTitle)) {
    return twitterTitle
  }

  // If site is javascript based and has a no-title attribute when unloaded, use it.
  const noTitle = titleEl?.getAttr('no-title')
  if (notBlank(noTitle)) {
    return noTitle
  }

  return ''
}

async function scrapeViaRequestUrl(url: string): Promise<string> {
  const response = await requestUrl({ url, headers: HEADERS })
  const contentType = response.headers['content-type'] || ''
  if (!contentType.includes('text/html')) return getUrlFinalSegment(url)
  return extractTitleFromHtml(response.text, url)
}

async function scrapeViaRequest(url: string): Promise<string> {
  const html = await request({ url, headers: HEADERS })
  return extractTitleFromHtml(html, url)
}

async function scrape(url: string): Promise<string> {
  // Try requestUrl first (Obsidian's primary API, bypasses CORS)
  try {
    const title = await scrapeViaRequestUrl(url)
    if (notBlank(title)) return title
  } catch (ex) {
    console.log(`obsidian-auto-link-title: requestUrl failed for ${url}:`, ex)
  }

  // Fallback to request() which uses a different code path
  try {
    const title = await scrapeViaRequest(url)
    if (notBlank(title)) return title
  } catch (ex) {
    console.log(`obsidian-auto-link-title: request also failed for ${url}:`, ex)
  }

  // Retry requestUrl once (transient failures)
  try {
    const title = await scrapeViaRequestUrl(url)
    if (notBlank(title)) return title
  } catch (ex) {
    console.error(`obsidian-auto-link-title: retry failed for ${url}:`, ex)
  }

  return ''
}

function getUrlFinalSegment(url: string): string {
  try {
    const segments = new URL(url).pathname.split('/')
    const last = segments.pop() || segments.pop() // Handle potential trailing slash
    return last
  } catch (_) {
    return 'File'
  }
}

export default async function getPageTitle(url: string) {
  if (!(url.startsWith('http') || url.startsWith('https'))) {
    url = 'https://' + url
  }

  return scrape(url)
}
