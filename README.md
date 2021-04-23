## Obsidian Auto Link Title
![Auto linking example](auto-link-title.gif)

### Automatically Title New Links
This plugin automatically fetches the webpage to extract link titles when they're pasted, creating a markdown link with the correct title set.

#### For example:

When pasting `https://github.com/zolrath/obsidian-auto-link-title` the plugin fetches the page and retrieves the title, resulting in a paste of: `[zolrath/obsidian-auto-link-title: Automatically fetch the titles of pasted links](https://github.com/zolrath/obsidian-auto-link-title)`

### Add Titles To Existing Raw URLs
Additionally, using `ctrl-shift-e` (Windows) or `cmd-shift-e` (OS X) you can enhance an existing raw link to a markdown formatted link with the proper title.

If your text cursor is within the url `https://github.com/zolrath/obsidian-auto-link-title` pressing `ctrl-shift-e` or `cmd-shift-e` converts the text to `[zolrath/obsidian-auto-link-title: Automatically fetch the titles of pasted links](https://github.com/zolrath/obsidian-auto-link-title)`

### Overwrite Titles Of Existing Markdown Links
Additionally, using `ctrl-shift-e` (Windows) or `cmd-shift-e` (OS X) you can overwrite an existing title of a markdown link with the fetched title from the url.

If your text cursor is within `[some plugin](https://github.com/zolrath/obsidian-auto-link-title)` pressing `ctrl+shift+e` fetches the sites title and replaces it, resulting in `[zolrath/obsidian-auto-link-title: Automatically fetch the titles of pasted links](https://github.com/zolrath/obsidian-auto-link-title)`

### Mobile Pasting
In order to paste the URL ensure you perform the `Tap and Hold -> Paste` action to paste the URL into your document.

#### Gboard
Google's [Gboard](https://play.google.com/store/apps/details?id=com.google.android.inputmethod.latin&hl=en_US&gl=US) keyboard has a Clipboard helper shortcut above the keyboard to quickly paste.
Due to the implementation of that feature, it does not trigger the `paste` event, preventing this plugin from interacting with the text.

### Privacy Note
In order to retrieve the title this plugin downloads the page located at the pasted URL and extracts the title.

`<head><title>Title</title></head>`

On Desktop machines this happens using electrons `BrowserWindow`, allowing it to handle extended character sets such as Chinese with no issue.

However, on mobile as we are not using the electron platform we must simply `fetch` the page.
Due to CORS restrictions on web servers disallowing direct `fetch`es it uses the [allorigins.win](https://allorigins.win) proxy to download the page. This proxy does not support other character sets and will return them as question marks.