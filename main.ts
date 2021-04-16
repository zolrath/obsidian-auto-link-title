import { App, Modal, Plugin, PluginSettingTab, Setting } from "obsidian";
import { clipboard } from "electron";
import * as CodeMirror from "codemirror";

interface AutoLinkTitleSettings {
  regex: RegExp;
  linkRegex: RegExp;
}

interface WordBoundaries {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
}

const DEFAULT_SETTINGS: AutoLinkTitleSettings = {
  regex: /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/,
  linkRegex: /^\[([\w\s\d]+)\]\((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\)$/,
};

export default class AutoLinkTitle extends Plugin {
  settings: AutoLinkTitleSettings;

  async onload() {
    console.log("loading obsidian-auto-link-title");

    await this.loadSettings();
    // this.addSettingTab(new AutoLinkTitleSettingsTab(this.app, this));
    this.addCommand({
      id: "paste-url-with-title",
      name: "Paste and auto populate URL titles",
      callback: () => this.pasteUrlWithTitle(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "b",
        },
      ],
    });
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
    let selectedText = (AutoLinkTitle.getSelectedText(editor) || '').trim();

    if (this.isUrl(selectedText)) {
      this.convertUrlToTitledLink(selectedText)
    }
  }

  pasteUrlWithTitle(): void {
    let editor = this.getEditor();
    let clipboardText = clipboard.readText("clipboard");

    // If its not a URL, simply paste the text
    if (clipboardText && !this.isUrl(clipboardText)) {
      editor.replaceSelection(clipboardText);
      return;
    }

    this.convertUrlToTitledLink(clipboardText)
  }

  convertUrlToTitledLink(text: string): void {
    let editor = this.getEditor();

    // Instantly paste so you don't wonder if paste is broken
    editor.replaceSelection("")
    let cursor = editor.getCursor();
    editor.replaceSelection(`[Fetching Title](${text})`);

    // Create marker so we can replace Fetching Title with actual title
    let start = { line: cursor.line, ch: cursor.ch + 1 };
    let end = { line: cursor.line, ch: cursor.ch + 15 };
    let marker = editor.markText(start, end)

    // Fetch title from site, replace Fetching Title with actual title
    this.fetchUrlTitle(text).then((title) => {
      var location = marker.find()
      editor.replaceRange(title, location.from, location.to)
      marker.clear()
    });
  }

  fetchUrlTitle(text: string): Promise<string> {
    console.log(`Fetching ${text} for title`);
    // Because of CORS you can't fetch the site directly
    var corsed = `https://api.allorigins.win/get?url=${encodeURIComponent(
      text
    )}`;

    return fetch(corsed)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const title = doc.querySelectorAll("title")[0];
        if (title == null || title.innerText.length == 0) {
          // If site is javascript based and has a no-title attribute when unloaded, use it.
          var notitle = title.getAttr("no-title")
          if (notitle != null) return notitle

          // Otherwise if the site has no title/requires javascript simply return Title Unknown
          return "Title Unknown"
        }
        return title.innerText;
      })
      .catch((error) => "Site Unreachable");
  }

  isUrl(text: string): boolean {
    let urlRegex = new RegExp(this.settings.regex);
    return urlRegex.test(text);
  }

  isLinkedUrl(text: string): boolean {
    let urlRegex = new RegExp(this.settings.linkRegex);
    return urlRegex.test(text);
  }

  getUrlFromLink(text: string): string {
    let urlRegex = new RegExp(this.settings.linkRegex);
    return urlRegex.exec(text)[0];
  }

  private getEditor(): CodeMirror.Editor {
    let activeLeaf: any = this.app.workspace.activeLeaf;
    return activeLeaf.view.sourceMode.cmEditor;
  }

    private static getSelectedText(editor: CodeMirror.Editor): string {
    if (!editor.somethingSelected()) {
      let wordBoundaries = this.getWordBoundaries(editor);
      editor.getDoc().setSelection(wordBoundaries.start, wordBoundaries.end);
    }
    return editor.getSelection();
  }

  private static getWordBoundaries(editor: CodeMirror.Editor): WordBoundaries {
    let startCh, endCh: number;
    let cursor = editor.getCursor();

    if (editor.getTokenTypeAt(cursor) === "url") {
      let token = editor.getTokenAt(cursor);
      startCh = token.start;
      endCh = token.end;
    } else {
      let word = editor.findWordAt(cursor);
      startCh = word.anchor.ch;
      endCh = word.head.ch;
    }

    return {
      start: { line: cursor.line, ch: startCh },
      end: { line: cursor.line, ch: endCh },
    };
  }

  onunload() {
    console.log("unloading obsidian-auto-link-title");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// class AutoLinkTitleSettingsTab extends PluginSettingTab {
//   plugin: AutoLinkTitle;

//   constructor(app: App, plugin: AutoLinkTitle) {
//     super(app, plugin);
//     this.plugin = plugin;
//   }

//   display(): void {
//     let { containerEl } = this;

//     containerEl.empty();

//     containerEl.createEl("h2", { text: "Settings for Auto Link Title." });

//     new Setting(containerEl)
//       .setName("URL Regex")
//       .setDesc("Regex used to detect links")
//       .addText((text) =>
//         text
//           .setPlaceholder(DEFAULT_SETTINGS.regex)
//           .setValue(DEFAULT_SETTINGS.regex)
//           .onChange(async (value) => {
//             console.log("Regex: " + value);
//             this.plugin.settings.regex = value;
//             await this.plugin.saveSettings();
//           })
//       );
//   }
// }
