import {Editor} from 'obsidian';

interface WordBoundaries {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
}

export class EditorExtensions {
  public static getSelectedText(editor: Editor): string {
    if (!editor.somethingSelected()) {
      let wordBoundaries = this.getWordBoundaries(editor);
      editor.getDoc().setSelection(wordBoundaries.start, wordBoundaries.end);
    }
    return editor.getSelection();
  }

  private static getWordBoundaries(editor: Editor): WordBoundaries {
    let startCh, endCh: number;
    let cursor = editor.getCursor();

    // If its a normal URL token this is not a markdown link
    // In this case we can simply overwrite the link boundaries as-is
    if (editor.getTokenTypeAt(cursor) === "url") {
      let token = editor.getTokenAt(cursor);
      startCh = token.start;
      endCh = token.end;
    }
    // If it's a "string url" this likely means we're in a markdown link
    // Check if this is true, then return the boundaries of the markdown link as a whole
    else if (editor.getTokenTypeAt(cursor) === "string url") {
      let token = editor.getTokenAt(cursor);
      startCh = token.start;
      endCh = token.end;

      // Check if the characters before the url are ]( to indicate a markdown link
      var titleEnd = editor.getRange(
        { ch: token.start - 2, line: cursor.line },
        { ch: token.start, line: cursor.line }
      );

      // Check if the character after the url is )
      var linkEnd = editor.getRange(
        { ch: token.end, line: cursor.line },
        { ch: token.end + 2, line: cursor.line }
      );

      // If the link is a string url these *should* be true
      if (titleEnd == "](" && linkEnd == ")") {
        // Check back 400 characters to see if we've found the start of the link
        // If we don't find a [ in that time, this is probably not a link
        let beforeLink = editor.getRange(
          { ch: token.start - 400, line: cursor.line },
          { line: cursor.line, ch: token.start }
        );

        // Get the last [ in the text in case we've found multiple links in our lookback
        var lastBrace = beforeLink.lastIndexOf("[");

        // If we've found a brace, we're in a link!
        if (lastBrace > -1) {
          let bracePosition = beforeLink.length - lastBrace;
          startCh = token.start - bracePosition;
          endCh = token.end + 1;
        }
      }
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
}
