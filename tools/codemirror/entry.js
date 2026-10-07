// Everything assets/opgave.js needs from CodeMirror, bundled into one file.
export { EditorState } from "@codemirror/state";
export {
  EditorView, keymap, lineNumbers, highlightActiveLine,
  highlightActiveLineGutter, drawSelection,
} from "@codemirror/view";
export { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
export {
  indentOnInput, bracketMatching, syntaxHighlighting, HighlightStyle, indentUnit,
} from "@codemirror/language";
export { python } from "@codemirror/lang-python";
export { tags } from "@lezer/highlight";
