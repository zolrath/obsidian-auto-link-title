## Obsidian Auto Link Title
![Auto linking example](auto-link-title.gif)

### Automatically Title New Links
This plugin automatically fetches link titles when they're pasted using the shortcut `ctrl+shift+b` or `cmd+shift+b`

For example:

When pasting `https://github.com/zolrath/obsidian-auto-link-title` the plugin fetches the page and retrieves the title, resulting in a paste of: `[zolrath/obsidian-auto-link-title: Automatically fetch the titles of pasted links](https://github.com/zolrath/obsidian-auto-link-title)`

Personally, I'm using [hotkey-helper](https://github.com/pjeby/hotkey-helper) to reassign the hotkey to `ctrl+v` which results in this behavior occurring for every URL pasted into Obsidian.

### Add Titles To Existing Raw Links
Additionally, using `ctrl+shift+e` you can enhance an existing raw link to a markdown formatted link with the proper title.

If your text cursor is within the url `https://github.com/zolrath/obsidian-auto-link-title` pressing `ctrl+shift+e` converts the text to `[zolrath/obsidian-auto-link-title: Automatically fetch the titles of pasted links](https://github.com/zolrath/obsidian-auto-link-title)`