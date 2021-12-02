import { EditorExtensions } from "editor-enhancements";
import { Plugin, MarkdownView, Editor } from "obsidian";
import { AutoLinkTitleSettings, DEFAULT_SETTINGS } from './settings'
import { CheckIf } from "checkif";
import getPageTitle from "scraper";

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
    this.pasteFunction = this.pasteUrlWithTitle.bind(this);
    this.app.workspace.containerEl.addEventListener(
      "paste",
      this.pasteFunction,
      true
    );

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
    let clipboardText = clipboard.clipboardData.getData("text/plain");
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

  convertUrlToTitledLink(editor: Editor, url: string): void {
    // Generate a unique id for find/replace operations for the title.
    let pasteId = `Fetching Title#${this.createBlockHash()}`;

    // Instantly paste so you don't wonder if paste is broken
    editor.replaceSelection(`[${pasteId}](${url})`);

    // Fetch title from site, replace Fetching Title with actual title
    this.fetchUrlTitle(url).then((title) => {
      let text = editor.getValue();

      let start = text.indexOf(pasteId);
      if (start < 0) {
        console.log(`Unable to find text "${pasteId}" in current editor, bailing out; link ${url}`);
      } else {
        let end = start + pasteId.length;
        let startPos = EditorExtensions.getEditorPositionFromIndex(text, start);
        let endPos = EditorExtensions.getEditorPositionFromIndex(text, end);

        editor.replaceRange(title, startPos, endPos);
      }
    });
  }

  fetchUrlTitle(url: string): Promise<string> {
    return getPageTitle(url).then(title => {
      if (title == null || title == "") {
          return "Title Unknown";
      }
      return title.trim();
    }).catch((error) => {
      // console.error(error)
      return "Site Unreachable"
    });
  }

  private getEditor(): Editor {
    let activeLeaf = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeLeaf == null) return;
    return activeLeaf.editor;
  }

  public getUrlFromLink(link: string): string {
    let urlRegex = new RegExp(DEFAULT_SETTINGS.linkRegex);
    return urlRegex.exec(link)[2];
  }

  // Custom hashid by @shabegom
  private createBlockHash(): string {
    let result = "";
    var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < 4; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  onunload() {
    console.log("unloading obsidian-auto-link-title");
    this.app.workspace.containerEl.removeEventListener(
      "paste",
      this.pasteFunction,
      true
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}