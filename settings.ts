import AutoLinkTitle from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { Notice } from "obsidian";

export interface AutoLinkTitleSettings {
  regex: RegExp;
  lineRegex: RegExp;
  linkRegex: RegExp;
  linkLineRegex: RegExp;
  imageRegex: RegExp;
  shouldPreserveSelectionAsTitle: boolean;
  enhanceDefaultPaste: boolean;
  enhanceDropEvents: boolean;
  websiteBlacklist: string;
  maximumTitleLength: number;
  useNewScraper: boolean;
  linkPreviewApiKey: string;
  useBetterPasteId: boolean;
  defaultHeadersJson: string;
  domainHeadersJson: string;
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
  enhanceDefaultPaste: true,
  shouldPreserveSelectionAsTitle: false,
  enhanceDropEvents: true,
  websiteBlacklist: "",
  maximumTitleLength: 0,
  useNewScraper: false,
  linkPreviewApiKey: "",
  useBetterPasteId: false,
  defaultHeadersJson: "{}",
  domainHeadersJson: "{}",
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
      .setDesc("Set the maximum length of the title. Set to 0 to disable.")
      .addText((val) =>
        val
          .setValue(this.plugin.settings.maximumTitleLength.toString(10))
          .onChange(async (value) => {
            const titleLength = Number(value);
            this.plugin.settings.maximumTitleLength =
              isNaN(titleLength) || titleLength < 0 ? 0 : titleLength;
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

    new Setting(containerEl)
      .setName("Use Better Fetching Placeholder")
      .setDesc(
        "Use a more readable placeholder when fetching the title of a link."
      )
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.useBetterPasteId)
          .onChange(async (value) => {
            console.log(value);
            this.plugin.settings.useBetterPasteId = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("LinkPreview API Key")
      .setDesc(
        "API key for the LinkPreview.net service. Get one at https://my.linkpreview.net/access_keys"
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.linkPreviewApiKey || "")
          .onChange(async (value) => {
            const trimmedValue = value.trim();
            if (trimmedValue.length > 0 && trimmedValue.length !== 32) {
              new Notice("LinkPreview API key must be 32 characters long");
              this.plugin.settings.linkPreviewApiKey = "";
            } else {
              this.plugin.settings.linkPreviewApiKey = trimmedValue;
            }
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Domain Header Json for New Scraper")
      .setDesc("Request headers for domains in JSON format, for example: {\"example.com\": {\"User-Agent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\",\"Cookie\": \"abc\", \"Referer\": \"example.com\"}}")
      .addTextArea((val) =>
        val
          .setValue(this.plugin.settings.domainHeadersJson)
          .setPlaceholder("{\"example.com\": {\"User-Agent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\",\"Cookie\": \"abc\", \"Referer\": \"example.com\"}}")
          .onChange(async (value) => {
            this.plugin.settings.domainHeadersJson = value;
            await this.plugin.saveSettings();
          })
          .then((textArea) => {
            textArea.inputEl.style.minWidth = "500px";
            textArea.inputEl.style.minHeight = "400px";
            textArea.inputEl.style.resize = "vertical";
          })
      );

    new Setting(containerEl)
      .setName("Default Header Json for New Scraper")
      .setDesc("Default request headers in JSON format used when NOT setting the header for a domain , for example: {\"Accept\": \"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\",\"User-Agent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"}. In most cases, setting {} is sufficient.")
      .addTextArea((val) =>
        val
          .setValue(this.plugin.settings.defaultHeadersJson)
          .setPlaceholder("{\"Accept\": \"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\",\"User-Agent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"}")
          .onChange(async (value) => {
            this.plugin.settings.defaultHeadersJson = value;
            await this.plugin.saveSettings();
          })
          .then((textArea) => {
            textArea.inputEl.style.minWidth = "500px";
            textArea.inputEl.style.minHeight = "400px";
            textArea.inputEl.style.resize = "vertical";
          })
      );
  }
}
