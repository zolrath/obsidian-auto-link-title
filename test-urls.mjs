/**
 * Integration test: fetches real URLs with browser-like headers
 * and verifies that a meaningful <title> is extracted.
 *
 * Usage: node test-urls.mjs
 * Exit code 0 = all pass, 1 = failures
 */

import { JSDOM } from "jsdom";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const BAD_TITLES = [
  "site unreachable",
  "title unavailable",
  "error fetching title",
];

/** Extract <title> from HTML, matching what scraper.ts does */
function extractTitle(html) {
  const dom = new JSDOM(html);
  const titleEl = dom.window.document.querySelector("title");
  return titleEl?.textContent?.trim() || "";
}

/** Return true if title looks like a real page title */
function isGoodTitle(title) {
  if (!title) return false;
  const lower = title.toLowerCase();
  return !BAD_TITLES.some((bad) => lower.includes(bad));
}

const TEST_URLS = [
  {
    url: "https://x.com/nikunj/status/2022438070092759281",
    // x.com may require JS; we just verify we don't get "Site Unreachable"
    expectGoodTitle: false, // x.com needs JS rendering, title may be generic
    expectReachable: true,
  },
  {
    url: "https://www.rilldata.com/blog/bi-as-code-and-the-new-era-of-genbi",
    expectGoodTitle: true,
    expectReachable: true,
  },
  {
    url: "https://www.rilldata.com/blog/building-an-agent-friendly-local-first-analytics-stack-with-motherduck-and-rill",
    expectGoodTitle: true,
    expectReachable: true,
  },
];

let passed = 0;
let failed = 0;

for (const test of TEST_URLS) {
  const label = test.url;
  try {
    // Test 1: HEAD request succeeds (no "Site Unreachable")
    const headRes = await fetch(test.url, { method: "HEAD", headers: HEADERS, redirect: "follow" });
    if (test.expectReachable && !headRes.ok) {
      // Some sites reject HEAD but accept GET — that's fine, just warn
      console.log(`  WARN: HEAD returned ${headRes.status} for ${label} (will try GET)`);
    }

    // Test 2: GET request returns HTML with a title
    const getRes = await fetch(test.url, { headers: HEADERS, redirect: "follow" });
    if (!getRes.ok) {
      console.log(`  FAIL: GET returned ${getRes.status} for ${label}`);
      failed++;
      continue;
    }

    const contentType = getRes.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      console.log(`  FAIL: content-type is "${contentType}" (not HTML) for ${label}`);
      failed++;
      continue;
    }

    const html = await getRes.text();
    const title = extractTitle(html);

    if (test.expectGoodTitle) {
      if (isGoodTitle(title)) {
        console.log(`  PASS: "${title}" — ${label}`);
        passed++;
      } else {
        console.log(`  FAIL: bad title "${title}" — ${label}`);
        failed++;
      }
    } else {
      // For JS-heavy sites like x.com, just verify we got a response (not "Site Unreachable")
      console.log(`  PASS: reachable, title="${title}" — ${label}`);
      passed++;
    }
  } catch (err) {
    console.log(`  FAIL: ${err.message} — ${label}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed, ${TEST_URLS.length} total`);
process.exit(failed > 0 ? 1 : 0);
