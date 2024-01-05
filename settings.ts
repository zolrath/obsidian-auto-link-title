import AutoLinkTitle from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface AutoLinkTitleSettings {
  regex: RegExp;
  lineRegex: RegExp;
  linkRegex: RegExp;
  linkLineRegex: RegExp;
  imageRegex: RegExp;
  shouldReplaceSelection: boolean;
  enhanceDefaultPaste: boolean;
  websiteBlacklist: string;
  maximumTitleLength: number;
  customTitleTemplates: Array<WebsiteTitleTemplate>
}

export interface WebsiteTitleTemplate {
  domain: string;
  search: string;
  replace: string;
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
  websiteBlacklist: "",
  maximumTitleLength: 0,
  customTitleTemplates: [],
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

    this.containerEl.createEl("h2", { text: "Website Title Templates" });

    const desc = document.createDocumentFragment();
    desc.append(
      "Title templates allow you to override how a sites title is displayed per domain."
    );
    desc.append(
      "By adding a domain ie github.com to the domain list the title will be passed through a regex replace, replacing it with the replace strings results."
    );

    new Setting(this.containerEl).setDesc(desc);

    this.plugin.settings.customTitleTemplates.forEach(
      ({ domain, search, replace }, index) => {
        const d = new Setting(this.containerEl)
          .setName("Domain and Title Template")
          .addText(val =>
            val
              .setPlaceholder("example.com")
              .setValue(domain)
              .onChange(value => {
                this.plugin.settings.customTitleTemplates[index].domain = value
                this.plugin.saveSettings();
              })
          )
          .addText(val =>
            val
              .setPlaceholder("/search/")
              .setValue(search)
              .onChange(value => {
                this.plugin.settings.customTitleTemplates[index].search = value
                this.plugin.saveSettings();
              })
          )
          .addText(val =>
            val
              .setPlaceholder("($1) Replace")
              .setValue(replace)
              .onChange(value => {
                this.plugin.settings.customTitleTemplates[index].replace = value
                this.plugin.saveSettings();
              })
          )
          .addExtraButton((cb) => {
            cb.setIcon("cross")
              .setTooltip("Delete")
              .onClick(() => {
                this.plugin.settings.customTitleTemplates.splice(index, 1)
                this.plugin.saveSettings();
                // Force refresh
                this.display();
              });
          });
      })

    new Setting(this.containerEl).addButton((cb) => {
      cb.setButtonText("Add new website title template")
        // .setCta()
        .onClick(() => {
          this.plugin.settings.customTitleTemplates.push({ domain: null, search: null, replace: null });
          this.plugin.saveSettings();
          // Force refresh
          this.display();
        });
    });
    //   this.plugin.settings.customTitleTemplates.forEach(
    //     (template, index) => {
    //       const s = new Setting(this.containerEl)
    //         .addSearch((cb) => {
    //           new FileSuggest(
    //             cb.inputEl,
    //             this.plugin,
    //             FileSuggestMode.TemplateFiles
    //           );
    //           cb.setPlaceholder("Example: folder1/template_file")
    //             .setValue(template)
    //             .onChange((new_template) => {
    //               if (
    //                 new_template &&
    //                 this.plugin.settings.enabled_templates_hotkeys.contains(
    //                   new_template
    //                 )
    //               ) {
    //                 log_error(
    //                   new TemplaterError(
    //                     "This template is already bound to a hotkey"
    //                   )
    //                 );
    //                 return;
    //               }
    //               this.plugin.command_handler.add_template_hotkey(
    //                 this.plugin.settings
    //                   .enabled_templates_hotkeys[index],
    //                 new_template
    //               );
    //               this.plugin.settings.enabled_templates_hotkeys[
    //                 index
    //               ] = new_template;
    //               this.plugin.save_settings();
    //             });
    //           // @ts-ignore
    //           cb.containerEl.addClass("templater_search");
    //         })
    //         .addExtraButton((cb) => {
    //           cb.setIcon("any-key")
    //             .setTooltip("Configure Hotkey")
    //             .onClick(() => {
    //               // TODO: Replace with future "official" way to do this
    //               // @ts-ignore
    //               app.setting.openTabById("hotkeys");
    //               // @ts-ignore
    //               const tab = app.setting.activeTab;
    //               tab.searchInputEl.value = "Templater: Insert";
    //               tab.updateHotkeyVisibility();
    //             });
    //         })
    //         .addExtraButton((cb) => {
    //           cb.setIcon("up-chevron-glyph")
    //             .setTooltip("Move up")
    //             .onClick(() => {
    //               arraymove(
    //                 this.plugin.settings
    //                   .enabled_templates_hotkeys,
    //                 index,
    //                 index - 1
    //               );
    //               this.plugin.save_settings();
    //               this.display();
    //             });
    //         })
    //         .addExtraButton((cb) => {
    //           cb.setIcon("down-chevron-glyph")
    //             .setTooltip("Move down")
    //             .onClick(() => {
    //               arraymove(
    //                 this.plugin.settings
    //                   .enabled_templates_hotkeys,
    //                 index,
    //                 index + 1
    //               );
    //               this.plugin.save_settings();
    //               this.display();
    //             });
    //         })
    //         .addExtraButton((cb) => {
    //           cb.setIcon("cross")
    //             .setTooltip("Delete")
    //             .onClick(() => {
    //               this.plugin.command_handler.remove_template_hotkey(
    //                 this.plugin.settings
    //                   .enabled_templates_hotkeys[index]
    //               );
    //               this.plugin.settings.enabled_templates_hotkeys.splice(
    //                 index,
    //                 1
    //               );
    //               this.plugin.save_settings();
    //               // Force refresh
    //               this.display();
    //             });
    //         });
    //       s.infoEl.remove();
    //     }
    //   );
    //
    //   new Setting(this.containerEl).addButton((cb) => {
    //     cb.setButtonText("Add new website title template")
    //       .setCta()
    //       .onClick(() => {
    //         this.plugin.settings..push("");
    //         this.plugin.save_settings();
    //         // Force refresh
    //         this.display();
    //       });
    //   });
    // }
    //     new Setting(containerEl)
    // .setName("Website Template")
    // .setDesc(
    //   "Allow custom titles based off domains by supplying a Regular Expression"
    // )
    // .add
    // .addTextArea((val) =>
    //   val
    //     .setValue(this.plugin.settings.websiteBlacklist)
    //     .setPlaceholder("localhost, tiktok.com")
    //     .onChange(async (value) => {
    //       this.plugin.settings.websiteBlacklist = value;
    //       await this.plugin.saveSettings();
    //     })
    // );
  }
}
