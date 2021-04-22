import { EditorExtensions } from "editor-enhancements";
import { Plugin, MarkdownView, Editor } from "obsidian";
import { nanoid } from "nanoid";
import { AutoLinkTitleSettings, DEFAULT_SETTINGS } from './settings'
import { CheckIf } from "checkif";

interface PasteFunction {
  (this: HTMLElement, ev: ClipboardEvent): void;
}

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
    // Only attempt fetch if online
    if (!navigator.onLine) return;

    let editor = this.getEditor();
    if (editor == null) return;

    let selectedText = (EditorExtensions.getSelectedText(editor) || "").trim();

    // If the cursor is on a raw html link, convert to a markdown link and fetch title
    if (CheckIf.isUrl(selectedText)) {
      this.convertUrlToTitledLink(editor, selectedText);
    }
    // If the cursor is on the URL part of a markdown link, fetch title and replace existing link title
    else if (CheckIf.isLinkedUrl(selectedText)) {
      var link = this.getUrlFromLink(selectedText);
      this.convertUrlToTitledLink(editor, link);
    }
  }

  pasteUrlWithTitle(clipboard: ClipboardEvent): void {
    // Only attempt fetch if online
    if (!navigator.onLine) return;
    
    let editor = this.getEditor();
    let clipboardText = clipboard.clipboardData.getData('text/plain');
    if (clipboardText == null || clipboardText == "") return;

    // If its not a URL, we return false to allow the default paste handler to take care of it.
    // Similarly, image urls don't have a meaningful <title> attribute so downloading it
    // to fetch the title is a waste of bandwidth.
    if (!CheckIf.isUrl(clipboardText) || CheckIf.isImage(clipboardText)) {
      return;
    }

    // We've decided to handle the paste, stop propagation to the default handler.
    clipboard.stopPropagation();
    clipboard.preventDefault();

    // If it looks like we're pasting the url into a markdown link already, don't fetch title
    // as the user has already probably put a meaningful title, also it would lead to the title 
    // being inside the link.
    if (CheckIf.isMarkdownLinkAlready(editor) || CheckIf.isAfterQuote(editor)) {
      editor.replaceSelection(clipboardText);
      return;
    }

    // At this point we're just pasting a link in a normal fashion, fetch its title.
    this.convertUrlToTitledLink(editor, clipboardText);
    return;
  }

  convertUrlToTitledLink(editor: Editor, text: string): void {
    // Generate a unique id for find/replace operations for the title.
    let pasteId = `Fetching Title#${nanoid(5)}`;

    // Instantly paste so you don't wonder if paste is broken
    editor.replaceSelection(`[${pasteId}](${text})`);

    // Fetch title from site, replace Fetching Title with actual title
    this.fetchUrlTitle(text).then((title) => {
      let text = editor.getValue();

      let start = text.indexOf(pasteId);
      let end = start + pasteId.length;
      let startPos = EditorExtensions.getEditorPositionFromIndex(text, start);
      let endPos = EditorExtensions.getEditorPositionFromIndex(text, end);

      editor.replaceRange(title, startPos, endPos);
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

  private getEditor(): Editor {
    let activeLeaf = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeLeaf == null) return;
    return activeLeaf.editor;
  }

  public getUrlFromLink(text: string): string {
    let urlRegex = new RegExp(DEFAULT_SETTINGS.linkRegex);
    return urlRegex.exec(text)[2];
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