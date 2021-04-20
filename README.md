## Obsidian Auto Link Title
![Auto linking example](auto-link-title.gif)

### Automatically Title New Links
This plugin automatically fetches link titles when they're pasted using the shortcut `ctrl+shift+b` or `cmd+shift+b`

#### For example:

When pasting `https://github.com/zolrath/obsidian-auto-link-title` the plugin fetches the page and retrieves the title, resulting in a paste of: `[zolrath/obsidian-auto-link-title: Automatically fetch the titles of pasted links](https://github.com/zolrath/obsidian-auto-link-title)`

Personally, I'm using [hotkey-helper](https://github.com/pjeby/hotkey-helper) to reassign the hotkey to `ctrl+v` which results in this behavior occurring for every URL pasted into Obsidian.

### Add Titles To Existing Raw URLs
Additionally, using `ctrl+shift+e` you can enhance an existing raw link to a markdown formatted link with the proper title.

If your text cursor is within the url `https://github.com/zolrath/obsidian-auto-link-title` pressing `ctrl+shift+e` converts the text to `[zolrath/obsidian-auto-link-title: Automatically fetch the titles of pasted links](https://github.com/zolrath/obsidian-auto-link-title)`

### Overwrite Titles Of Existing Markdown Links
Additionally, using `ctrl+shift+e` you can overwrite an existing title of a markdown link with the fetched title from the url.

If your text cursor is within the url portion (does not trigger in the title section) of `[some plugin](https://github.com/zolrath/obsidian-auto-link-title)` pressing `ctrl+shift+e` fetches the sites title and replaces it, resulting in `[zolrath/obsidian-auto-link-title: Automatically fetch the titles of pasted links](https://github.com/zolrath/obsidian-auto-link-title)`

### Privacy Note
In order to retrieve the title this plugin downloads the page located at the pasted URL and extracts the title.

`<head><title>Title</title></head>`

Due to CORS restrictions on web servers disallowing direct `fetch`es it uses the [allorigins.win](https://allorigins.win) proxy to download the page.