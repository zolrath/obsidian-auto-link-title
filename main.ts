import { App, Modal, Plugin, PluginSettingTab, Setting } from "obsidian";
import { clipboard } from "electron";
import * as CodeMirror from "codemirror";
const https = require("https");

interface AutoLinkTitleSettings {
  regex: string;
}

const DEFAULT_SETTINGS: AutoLinkTitleSettings = {
  regex:
    "^(http:\\/\\/www\\.|https:\\/\\/www\\.|http:\\/\\/|https:\\/\\/)?[a-z0-9]+([\\-.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$",
};

export default class AutoLinkTitle extends Plugin {
  settings: AutoLinkTitleSettings;

  async onload() {
    console.log("loading obsidian-auto-link-title");

    await this.loadSettings();
    this.addSettingTab(new AutoLinkTitleSettingsTab(this.app, this));
    this.addCommand({
      id: "paste-url-with-title",
      name: "",
      callback: () => this.pasteUrlWithTitle(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "b",
        },
      ],
    });
  }

  pasteUrlWithTitle(): void {
    let editor = this.getEditor();
    let clipboardText = clipboard.readText("clipboard");

    if (clipboardText && this.isUrl(clipboardText)) {
      this.fetchUrlTitle(clipboardText).then((title) => {
        editor.replaceSelection(`[${title}](${clipboardText})`);
      });
    } else {
      editor.replaceSelection(clipboardText);
    }
  }

  fetchUrlTitle(text: string): Promise<string> {
    console.log(`Fetching ${text} for title`);
    var crossed = `https://api.allorigins.win/get?url=${encodeURIComponent(
      text
    )}`;
    return fetch(crossed)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const title = doc.querySelectorAll("title")[0];
        return title.innerText;
      })
      .catch((error) => "Title Unknown");
  }

  isUrl(text: string): boolean {
    let urlRegex = new RegExp(this.settings.regex);
    return urlRegex.test(text);
  }

  private getEditor(): CodeMirror.Editor {
    let activeLeaf: any = this.app.workspace.activeLeaf;
    return activeLeaf.view.sourceMode.cmEditor;
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

class AutoLinkTitleSettingsTab extends PluginSettingTab {
  plugin: AutoLinkTitle;

  constructor(app: App, plugin: AutoLinkTitle) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Settings for Auto Link Title." });

    new Setting(containerEl)
      .setName("URL Regex")
      .setDesc("Regex used to detect links")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.regex)
          .setValue(DEFAULT_SETTINGS.regex)
          .onChange(async (value) => {
            console.log("Regex: " + value);
            this.plugin.settings.regex = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
