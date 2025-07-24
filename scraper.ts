import { requestUrl } from 'obsidian'
import AutoLinkTitle from "./main";

function blank(text: string): boolean {
  return text === undefined || text === null || text === ''
}

function notBlank(text: string): boolean {
  return !blank(text)
}

// method 2: get title via js request
async function scrape(url: string, plugin?: AutoLinkTitle): Promise<string> {
  try {
    // get header by domain or default
    let options: any = {};
    if (plugin) {
      const headers = await plugin.getHeadersForUrl(url);
      if (Object.keys(headers).length > 0) {
        options.headers = headers;
      }
    }

    const response = await requestUrl({ url, ...options });
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

// method 2: get title via js request
export default async function getPageTitle(url: string, plugin?: AutoLinkTitle) {
  if (!(url.startsWith('http') || url.startsWith('https'))) {
    url = 'https://' + url
  }

  return scrape(url, plugin)
}
