// Utility to fetch favicon URL for a given site
// Simple version: use https://www.google.com/s2/favicons?domain=... as fallback

export async function fetchFaviconUrl(siteUrl: string): Promise<string> {
    try {
        const url = new URL(siteUrl);
        const directFavicon = `${url.origin}/favicon.ico`;
        const googleFavicon = `https://www.google.com/s2/favicons?domain=${url.hostname}`;

        // Try direct favicon.ico first
        try {
            const res = await fetch(directFavicon, { method: 'HEAD' });
            if (res.ok && res.headers.get('content-type')?.includes('image')) {
                return directFavicon;
            }
        } catch (e) {
            // Ignore and fallback
        }
        // Fallback to Google S2
        return googleFavicon;
    } catch (e) {
        return "";
    }
}
