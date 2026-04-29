import { requestUrl } from 'obsidian'

function blank(text: string): boolean {
  return text === undefined || text === null || text === ''
}

function notBlank(text: string): boolean {
  return !blank(text)
}

const OEMBED_PROVIDERS: { pattern: RegExp; endpoint: string }[] = [
  {
    pattern: /https?:\/\/(www\.)?(youtube\.com\/(watch|shorts|live)|youtu\.be\/)/,
    endpoint: 'https://www.youtube.com/oembed',
  },
  {
    pattern: /https?:\/\/(www\.)?vimeo\.com\//,
    endpoint: 'https://vimeo.com/api/oembed.json',
  },
]

async function getOEmbedTitle(url: string): Promise<string | null> {
  for (const provider of OEMBED_PROVIDERS) {
    if (provider.pattern.test(url)) {
      try {
        const response = await requestUrl(
          `${provider.endpoint}?url=${encodeURIComponent(url)}&format=json`
        )
        const data = JSON.parse(response.text)
        if (notBlank(data.title)) return data.title
      } catch (_) {
        return null
      }
    }
  }
  return null
}

async function scrape(url: string): Promise<string> {
  try {
    const response = await requestUrl(url)
    if (!response.headers['content-type'].includes('text/html')) return getUrlFinalSegment(url)
    const html = response.text

    const doc = new DOMParser().parseFromString(html, 'text/html')
    const title = doc.querySelector('title')

    if (blank(title?.innerText)) {
      // If site is javascript based and has a no-title attribute when unloaded, use it.
      var noTitle = title?.getAttr('no-title')
      if (notBlank(noTitle)) {
        return noTitle
      }

      // Otherwise if the site has no title/requires javascript simply return Title Unknown
      return url
    }

    return title.innerText
  } catch (ex) {
    console.error(ex)
    return ''
  }
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

  const oEmbedTitle = await getOEmbedTitle(url)
  if (oEmbedTitle) return oEmbedTitle

  return scrape(url)
}
