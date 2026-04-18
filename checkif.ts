import { Editor } from "obsidian";
import { syntaxTree, ensureSyntaxTree } from "@codemirror/language";
import { DEFAULT_SETTINGS } from 'settings';

export class CheckIf {
  public static isInsideCodeBlock(editor: Editor): boolean {
    // @ts-expect-error - cm is an undocumented but stable EditorView reference
    const view = editor.cm;
    if (!view) return false;
    const pos = view.state.selection.main.head;
    const tree =
      ensureSyntaxTree(view.state, view.state.doc.length, 50) ?? syntaxTree(view.state);
    let found = false;
    tree.iterate({
      from: pos,
      to: pos,
      enter(n) {
        if (found) return false;
        // Obsidian's CM6 markdown parse produces node type names that are
        // underscore-joined HyperMD token classes (e.g. "HyperMD-codeblock_hmd-codeblock",
        // "formatting_formatting-code_inline-code"). We also tolerate the bare Lezer
        // markdown node names ("FencedCode", "InlineCode", ...) in case the token-class
        // layer is absent in some views.
        const name = n.type.name;
        if (
          name.includes("codeblock") ||
          name.includes("code-block") ||
          name.includes("inline-code") ||
          name === "FencedCode" ||
          name === "CodeBlock" ||
          name === "InlineCode" ||
          name === "CodeText"
        ) {
          found = true;
        }
      },
    });
    if (found) return true;

    // Fallback: an unclosed fenced block has no closing ``` yet, so the parser
    // hasn't committed it to a FencedCode node. Count fence markers on lines
    // strictly above the cursor line — an odd count means we're inside an open fence.
    const { doc } = view.state;
    const cursorLine = doc.lineAt(pos);
    let fenceMarkers = 0;
    for (let n = 1; n < cursorLine.number; n++) {
      if (/^\s{0,3}(`{3,}|~{3,})/.test(doc.line(n).text)) {
        fenceMarkers++;
      }
    }
    return fenceMarkers % 2 === 1;
  }

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
