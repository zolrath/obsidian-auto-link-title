const electronPkg = require("electron");
import { request } from "obsidian";

function blank(text: string): boolean {
  return text === undefined || text === null || text === "";
}

function notBlank(text: string): boolean {
  return !blank(text);
}

// Give up on a page that hasn't finished loading after this long.
const LOAD_TIMEOUT_MS = 15000;

// A separate, in-memory browser session for title fetching: pages loaded here can't
// read Obsidian's cookies or storage, and nothing they store survives a restart.
const SCRAPER_PARTITION = "auto-link-title-scraper";

function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

// Load a url and settle when the main frame finishes or fails, or when the timeout hits.
function load(window: any, url: string, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${timeoutMs} ms loading ${url}`)),
      timeoutMs
    );
    window.webContents.on("did-finish-load", () => {
      clearTimeout(timer);
      resolve();
    });
    window.webContents.on(
      "did-fail-load",
      (_event: any, errorCode: number, errorDescription: string, _validatedUrl: string, isMainFrame: boolean) => {
        // -3 (ERR_ABORTED) fires when a page redirects itself; a sub-frame failing
        // (an ad, a tracker) shouldn't fail the whole fetch either.
        if (!isMainFrame || errorCode === -3) return;
        clearTimeout(timer);
        reject(new Error(`Failed to load ${url}: ${errorDescription} (${errorCode})`));
      }
    );
    window.loadURL(url);
  });
}

async function electronGetPageTitle(url: string): Promise<string> {
  const { remote } = electronPkg;
  const { BrowserWindow } = remote;
  let window: any = null;

  try {
    window = new BrowserWindow({
      width: 1000,
      height: 600,
      show: false,
      webPreferences: {
        // Untrusted web pages load in this window: keep every protection on.
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        partition: SCRAPER_PARTITION,
        images: false,
      },
    });
    const contents = window.webContents;
    contents.setAudioMuted(true);

    // Pages may never open windows or tabs. This is what let ads on scraped pages
    // open fake-antivirus tabs in the system browser (issue #177).
    if (typeof contents.setWindowOpenHandler === "function") {
      contents.setWindowOpenHandler(() => ({ action: "deny" }));
    } else {
      // Electron before 12 (very old Obsidian builds) only has the "new-window" event.
      contents.on("new-window", (event: any) => event.preventDefault());
    }

    // Follow ordinary web redirects, but never hand off to other protocols
    // (obsidian://, file://, mailto:, OS handlers).
    contents.on("will-navigate", (event: any, newUrl: string) => {
      if (!isWebUrl(newUrl)) event.preventDefault();
    });
    contents.on("will-redirect", (event: any, newUrl: string) => {
      if (!isWebUrl(newUrl)) event.preventDefault();
    });

    // Refuse camera, microphone, notifications, location and every other permission prompt.
    contents.session.setPermissionRequestHandler(
      (_wc: any, _permission: string, callback: (granted: boolean) => void) => callback(false)
    );

    await load(window, url, LOAD_TIMEOUT_MS);

    const title = contents.getTitle();
    return notBlank(title) ? title : url;
  } catch (ex) {
    console.error(ex);
    return "";
  } finally {
    // Always tear the window down, including after failures and timeouts, so no page
    // keeps running scripts or holding connections in the background (issues #164, #177).
    if (window && !window.isDestroyed()) {
      window.destroy();
    }
  }
}

async function nonElectronGetPageTitle(url: string): Promise<string> {
  try {
    const html = await request({ url });

    const doc = new DOMParser().parseFromString(html, "text/html");
    const title = doc.querySelectorAll("title")[0];

    if (title == null || blank(title?.innerText)) {
      // If site is javascript based and has a no-title attribute when unloaded, use it.
      var noTitle = title?.getAttr("no-title");
      if (notBlank(noTitle)) {
        return noTitle;
      }

      // Otherwise if the site has no title/requires javascript simply return Title Unknown
      return url;
    }

    return title.innerText;
  } catch (ex) {
    console.error(ex);

    return "";
  }
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
    const response = await fetch(url, { method: "HEAD" });

    // Ensure site returns an ok status code before scraping
    if (!response.ok) {
      return "Site Unreachable";
    }

    // Ensure site is an actual HTML page and not a pdf or 3 gigabyte video file.
    let contentType = response.headers.get("content-type");
    if (!contentType.includes("text/html")) {
      return getUrlFinalSegment(url);
    }
    return null;
  } catch (err) {
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
    return electronGetPageTitle(url);
  } else {
    return nonElectronGetPageTitle(url);
  }
}
