const electronPkg = require("electron");
import { request, requestUrl } from "obsidian";

const HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

function blank(text: string): boolean {
  return text === undefined || text === null || text === "";
}

function notBlank(text: string): boolean {
  return !blank(text);
}

// async wrapper to load a url and settle on load finish or fail
async function load(window: any, url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    window.webContents.on("did-finish-load", (event: any) => resolve(event));
    window.webContents.on("did-fail-load", (event: any) => reject(event));
    window.loadURL(url);
  });
}

async function electronGetPageTitle(url: string): Promise<string> {
  const { remote } = electronPkg;
  const { BrowserWindow } = remote;

  try {
    const window = new BrowserWindow({
      width: 1000,
      height: 600,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        images: false,
      },
      show: false,
    });
    window.webContents.setAudioMuted(true);

    window.webContents.on("will-navigate", (event: any, newUrl: any) => {
      event.preventDefault();
      window.loadURL(newUrl);
    });

    await load(window, url);

    try {
      const title = window.webContents.getTitle();
      window.destroy();

      if (notBlank(title)) {
        return title;
      } else {
        return url;
      }
    } catch (ex) {
      window.destroy();
      return url;
    }
  } catch (ex) {
    console.error(ex);
    return "";
  }
}

function extractTitleFromHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Try <title> first
  const titleEl = doc.querySelector("title");
  if (notBlank(titleEl?.innerText)) {
    return titleEl.innerText;
  }

  // Fallback: og:title meta tag
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
  if (notBlank(ogTitle)) {
    return ogTitle;
  }

  // Fallback: twitter:title
  const twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute("content");
  if (notBlank(twitterTitle)) {
    return twitterTitle;
  }

  // If site is javascript based and has a no-title attribute when unloaded, use it.
  const noTitle = titleEl?.getAttr("no-title");
  if (notBlank(noTitle)) {
    return noTitle;
  }

  return "";
}

async function nonElectronGetPageTitle(url: string): Promise<string> {
  // Try request() first
  try {
    const html = await request({ url, headers: HEADERS });
    const title = extractTitleFromHtml(html);
    if (notBlank(title)) return title;
  } catch (ex) {
    console.log(`obsidian-auto-link-title: request failed for ${url}:`, ex);
  }

  // Fallback to requestUrl()
  try {
    const response = await requestUrl({ url, headers: HEADERS });
    const title = extractTitleFromHtml(response.text);
    if (notBlank(title)) return title;
  } catch (ex) {
    console.log(`obsidian-auto-link-title: requestUrl also failed for ${url}:`, ex);
  }

  return "";
}

function getUrlFinalSegment(url: string): string {
  try {
    const segments = new URL(url).pathname.split('/');
    const last = segments.pop() || segments.pop(); // Handle potential trailing slash
    return last;
  } catch (_) {
    return "File"
  }
}

async function tryGetFileType(url: string) {
  try {
    const response = await requestUrl({
      url,
      method: "HEAD",
      headers: HEADERS,
    });

    // Ensure site is an actual HTML page and not a pdf or 3 gigabyte video file.
    let contentType = response.headers['content-type'] || '';
    if (!contentType.includes("text/html")) {
      return getUrlFinalSegment(url);
    }
    return null;
  } catch (err) {
    // If HEAD request fails (CORS, 403, etc.), don't block — try scraping anyway
    return null;
  }
}

export default async function getPageTitle(url: string): Promise<string> {
  // If we're on Desktop use the Electron scraper
  if (!(url.startsWith("http") || url.startsWith("https"))) {
    url = "https://" + url;
  }

  // Try to do a HEAD request to see if the site is reachable and if it's an HTML page
  // If we error out due to CORS, we'll just try to scrape the page anyway.
  let fileType = await tryGetFileType(url);
  if (fileType) {
    return fileType;
  }

  if (electronPkg != null) {
    const title = await electronGetPageTitle(url);
    if (title && title !== url) return title;
    // Electron BrowserWindow failed — fall back to request()-based scraper
    console.log(`auto-link-title: electron scraper failed for ${url}, falling back to request()`);
  }

  return nonElectronGetPageTitle(url);
}
