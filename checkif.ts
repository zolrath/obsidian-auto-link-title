import { Editor } from "obsidian";
import { DEFAULT_SETTINGS } from 'settings';

export class CheckIf {
  public static isMarkdownLinkAlready(editor: Editor): boolean {
    let cursor = editor.getCursor();

      // Check if the characters before the url are ]( to indicate a markdown link
      var titleEnd = editor.getRange(
        { ch: cursor.ch - 2, line: cursor.line },
        { ch: cursor.ch, line: cursor.line }
      );

      return titleEnd == "]("
  }

  public static isAfterQuote(editor: Editor): boolean {
    let cursor = editor.getCursor();

      // Check if the characters before the url are " or ' to indicate we want the url directly
      // This is common in elements like <a href="linkhere"></a>
      var beforeChar = editor.getRange(
        { ch: cursor.ch - 1, line: cursor.line },
        { ch: cursor.ch, line: cursor.line }
      );

      return beforeChar == "\"" || beforeChar == "'"
  }

  public static isUrl(text: string): boolean {
    let urlRegex = new RegExp(DEFAULT_SETTINGS.regex);
    return urlRegex.test(text);
  }

  public static isImage(text: string): boolean {
    let imageRegex = new RegExp(DEFAULT_SETTINGS.imageRegex);
    return imageRegex.test(text);
  }

  public static isLinkedUrl(text: string): boolean {
    let urlRegex = new RegExp(DEFAULT_SETTINGS.linkRegex);
    return urlRegex.test(text);
  }

}