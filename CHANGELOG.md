# Changelog

## Unreleased (fork fixes)

### Problem
URLs pasted into Obsidian resolved to `[Site Unreachable](url)` or `[Title Unavailable | Site Unreachable](url)` despite the pages being accessible in a browser.

### Fixed
- Added browser User-Agent and Accept headers to all HTTP requests (`scraper.ts`, `electron-scraper.ts`) — many sites (x.com, rilldata.com) reject requests without a proper User-Agent
- Replaced bare `fetch()` HEAD check in `electron-scraper.ts` with Obsidian's `requestUrl` to bypass CORS restrictions
- Removed early "Site Unreachable" bail-out on failed HEAD requests — now falls through to attempt scraping
- Added fallback from Electron BrowserWindow scraper to `request()`-based scraper when BrowserWindow fails to load
- Added null-safe `content-type` header checks to prevent crashes on missing headers
- Added `og:title` and `twitter:title` meta tag fallbacks when `<title>` is empty
- Added retry with `request()` as fallback in new scraper (`scraper.ts`) when `requestUrl()` fails
- Silenced noisy `console.error` when LinkPreview API key is not configured
