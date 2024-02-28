import AutoLinkTitle from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface AutoLinkTitleSettings {
  regex: RegExp;
  lineRegex: RegExp;
  linkRegex: RegExp;
  linkLineRegex: RegExp;
  imageRegex: RegExp;
  shouldReplaceSelection: boolean;
  shouldPreserveSelectionAsTitle: boolean;
  enhanceDefaultPaste: boolean;
  enhanceDropEvents: boolean;
  websiteBlacklist: string;
  maximumTitleLength: number;
  useNewScraper: boolean;
}

export const DEFAULT_SETTINGS: AutoLinkTitleSettings = {
  regex:
    /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i,
  lineRegex:
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
  linkRegex:
    /^\[([^\[\]]*)\]\((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\)$/i,
  linkLineRegex:
    /\[([^\[\]]*)\]\((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\)/gi,
  imageRegex: /\.(gif|jpe?g|tiff?|png|webp|bmp|tga|psd|ai)$/i,
  shouldReplaceSelection: true,
  enhanceDefaultPaste: true,
  shouldPreserveSelectionAsTitle: false,
  enhanceDropEvents: true,
  websiteBlacklist: "",
  maximumTitleLength: 0,
  useNewScraper: false,
};

export class AutoLinkTitleSettingTab extends PluginSettingTab {
  plugin: AutoLinkTitle;

  constructor(app: App, plugin: AutoLinkTitle) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Enhance Default Paste")
      .setDesc(
        "Fetch the link title when pasting a link in the editor with the default paste command"
      )
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.enhanceDefaultPaste)
          .onChange(async (value) => {
            console.log(value);
            this.plugin.settings.enhanceDefaultPaste = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Enhance Drop Events")
      .setDesc(
        "Fetch the link title when drag and dropping a link from another program"
      )
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.enhanceDropEvents)
          .onChange(async (value) => {
            console.log(value);
            this.plugin.settings.enhanceDropEvents = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Maximum title length")
      .setDesc(
        "Set the maximum length of the title. Set to 0 to disable."
      )
      .addText((val) =>
        val
          .setValue(this.plugin.settings.maximumTitleLength.toString(10))
          .onChange(async (value) => {
            const titleLength = (Number(value))
            this.plugin.settings.maximumTitleLength = isNaN(titleLength) || titleLength < 0 ? 0 : titleLength;
            await this.plugin.saveSettings();
          })
      )

    new Setting(containerEl)
      .setName("Replace Selection")
      .setDesc(
        "Whether to replace a text selection with link and fetched title"
      )
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.shouldReplaceSelection)
          .onChange(async (value) => {
            console.log(value);
            this.plugin.settings.shouldReplaceSelection = value;
            await this.plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setName("Preserve selection as title")
      .setDesc(
        "Whether to prefer selected text as title over fetched title when pasting"
      )
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.shouldPreserveSelectionAsTitle)
          .onChange(async (value) => {
            console.log(value);
            this.plugin.settings.shouldPreserveSelectionAsTitle = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Website Blacklist")
      .setDesc(
        "List of strings (comma separated) that disable autocompleting website titles. Can be URLs or arbitrary text."
      )
      .addTextArea((val) =>
        val
          .setValue(this.plugin.settings.websiteBlacklist)
          .setPlaceholder("localhost, tiktok.com")
          .onChange(async (value) => {
            this.plugin.settings.websiteBlacklist = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Use New Scraper")
      .setDesc(
        "Use experimental new scraper, seems to work well on desktop but not mobile."
      )
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.useNewScraper)
          .onChange(async (value) => {
            console.log(value);
            this.plugin.settings.useNewScraper = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
