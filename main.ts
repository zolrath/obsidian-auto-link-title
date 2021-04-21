import { EditorExtensions } from "editor-enhancements";
import { Plugin, MarkdownView, Editor } from "obsidian";

interface AutoLinkTitleSettings {
  regex: RegExp;
  linkRegex: RegExp;
  imageRegex: RegExp;
}

interface PasteFunction {
  (this: HTMLElement, ev: ClipboardEvent): void;
}

const DEFAULT_SETTINGS: AutoLinkTitleSettings = {
  regex: /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i,
  linkRegex: /^\[([^\[\]]*)\]\((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\)$/i,
  imageRegex: /\.(gif|jpe?g|tiff?|png|webp|bmp|tga|psd|ai)/i
};


export default class AutoLinkTitle extends Plugin {
  settings: AutoLinkTitleSettings;
  pasteFunction: PasteFunction;

  async onload() {
    console.log("loading obsidian-auto-link-title");
    await this.loadSettings();

    // Listen to paste event
    this.pasteFunction = this.pasteUrlWithTitle.bind(this)
    this.app.workspace.containerEl.addEventListener("paste", this.pasteFunction, true);

    this.addCommand({
      id: "enhance-url-with-title",
      name: "Enhance existing URL with link and title",
      callback: () => this.addTitleToLink(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "e",
        },
      ],
    });
  }

  addTitleToLink(): void {
    let editor = this.getEditor();
    if (editor == null) return;

    let selectedText = (EditorExtensions.getSelectedText(editor) || "").trim();

    // If the cursor is on a raw html link, convert to a markdown link and fetch title
    if (this.isUrl(selectedText)) {
      this.convertUrlToTitledLink(editor, selectedText);
    }
    // If the cursor is on the URL part of a markdown link, fetch title and replace existing link title
    else if (this.isLinkedUrl(selectedText)) {
      var link = this.getUrlFromLink(selectedText);
      this.convertUrlToTitledLink(editor, link);
    }
  }

  pasteUrlWithTitle(clipboard: ClipboardEvent): void {
    let editor = this.getEditor();
    let clipboardText = clipboard.clipboardData.getData('text/plain');
    if (clipboardText == null || clipboardText == "") return;

    // If its not a URL, we return false to allow the default paste handler to take care of it.
    // Similarly, image urls don't have a meaningful <title> attribute so downloading it
    // to fetch the title is a waste of bandwidth.
    if (!this.isUrl(clipboardText) || this.isImage(clipboardText)) {
      return;
    }

    clipboard.stopPropagation();
    clipboard.preventDefault();

    // If it looks like we're pasting the url into a markdown link already, don't fetch title
    // as the user has already probably put a meaningful title, also it would lead to the title 
    // being inside the link.
    if (this.isMarkdownLinkAlready(editor)) {
      editor.replaceSelection(clipboardText);
      return;
    }

    // At this point we're just pasting a link in a normal fashion, fetch its title.
    this.convertUrlToTitledLink(editor, clipboardText);
    return;
  }

  convertUrlToTitledLink(editor: Editor, text: string): void {
    // Remove the existing link to reset the cursor position
    editor.replaceSelection("");
    // Instantly paste so you don't wonder if paste is broken
    let cursor = editor.getCursor();
    editor.replaceSelection(`[Fetching Title](${text})`);

    // Create marker so we can replace Fetching Title with actual title
    let start = { line: cursor.line, ch: cursor.ch + 1 };
    let end = { line: cursor.line, ch: cursor.ch + 15 };
    let marker = editor.markText(start, end);

    // Fetch title from site, replace Fetching Title with actual title
    this.fetchUrlTitle(text).then((title) => {
      var location = marker.find();
      editor.replaceRange(title, location.from, location.to);
      marker.clear();
    });
  }

  fetchUrlTitle(text: string): Promise<string> {
    // console.log(`Fetching ${text} for title`);
    // Because of CORS you can't fetch the site directly
    var corsed = `https://api.allorigins.win/get?url=${encodeURIComponent(
      text
    )}`;

    return fetch(corsed)
      .then(response => {
        return response.text();
      })
      .then(html => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const title = doc.querySelectorAll("title")[0];
        if (title == null || title.innerText.length == 0) {
          // If site is javascript based and has a no-title attribute when unloaded, use it.
          var noTitle = title.getAttr("no-title");
          if (noTitle != null) return noTitle;

          // Otherwise if the site has no title/requires javascript simply return Title Unknown
          return "Title Unknown";
        }
        return title.innerText;
      })
      .catch(error => "Site Unreachable");
  }

  isMarkdownLinkAlready(editor: Editor): boolean {
    let cursor = editor.getCursor();

      // Check if the characters before the url are ]( to indicate a markdown link
      var titleEnd = editor.getRange(
        { ch: cursor.ch - 2, line: cursor.line },
        { ch: cursor.ch, line: cursor.line }
      );

      return titleEnd == "]("
  }

  isUrl(text: string): boolean {
    let urlRegex = new RegExp(this.settings.regex);
    return urlRegex.test(text);
  }

  isImage(text: string): boolean {
    let imageRegex = new RegExp(this.settings.imageRegex);
    return imageRegex.test(text);
  }

  isLinkedUrl(text: string): boolean {
    let urlRegex = new RegExp(this.settings.linkRegex);
    return urlRegex.test(text);
  }

  getUrlFromLink(text: string): string {
    let urlRegex = new RegExp(this.settings.linkRegex);
    return urlRegex.exec(text)[2];
  }

  private getEditor(): Editor {
    let activeLeaf = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeLeaf == null) return;
    return activeLeaf.editor;
  }
  onunload() {
    console.log("unloading obsidian-auto-link-title");
    this.app.workspace.containerEl.removeEventListener("paste", this.pasteFunction, true);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}