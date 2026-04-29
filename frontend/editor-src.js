import { EditorView, basicSetup }         from 'codemirror';
import { keymap }                         from '@codemirror/view';
import { EditorState }                    from '@codemirror/state';
import { javascript }                     from '@codemirror/lang-javascript';
import { python }                         from '@codemirror/lang-python';
import { json }                           from '@codemirror/lang-json';
import { markdown }                       from '@codemirror/lang-markdown';
import { html }                           from '@codemirror/lang-html';
import { css }                            from '@codemirror/lang-css';
import { StreamLanguage }                 from '@codemirror/language';
import { go }                             from '@codemirror/legacy-modes/mode/go';
import { defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';

function getLanguage(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map = {
    'js': javascript(), 'ts': javascript({ typescript: true }),
    'jsx': javascript({ jsx: true }), 'tsx': javascript({ jsx: true, typescript: true }),
    'py': python(), 'pyw': python(),
    'json': json(),
    'md': markdown(), 'mdx': markdown(),
    'html': html(), 'htm': html(),
    'css': css(), 'scss': css(),
    'go': StreamLanguage.define(go),
  };
  return map[ext] || null;
}

function buildTheme() {
  const s       = getComputedStyle(document.documentElement);
  const cyan    = s.getPropertyValue('--cyan').trim()     || '#5BC8E8';
  const violet  = s.getPropertyValue('--violet').trim()   || '#8855EE';
  const magenta = s.getPropertyValue('--magenta').trim()  || '#CC44AA';
  const bg      = s.getPropertyValue('--bg').trim()       || '#08080E';
  const text    = s.getPropertyValue('--text').trim()     || '#D8D8E8';
  const mute    = s.getPropertyValue('--text-mute').trim()|| '#606080';
  const dim     = s.getPropertyValue('--text-dim').trim() || '#9999BB';

  return EditorView.theme({
    '&': { height: '100%', backgroundColor: bg, color: text, fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace", fontSize: '13px' },
    '.cm-content': { padding: '12px 16px', caretColor: magenta, lineHeight: '1.7' },
    '.cm-cursor': { borderLeftColor: magenta, borderLeftWidth: '2px' },
    '.cm-selectionBackground, ::selection': { backgroundColor: `${violet}44 !important` },
    '.cm-focused .cm-selectionBackground': { backgroundColor: `${violet}55 !important` },
    '.cm-lineNumbers .cm-gutterElement': { color: mute, fontSize: '12px', paddingRight: '12px', minWidth: '40px' },
    '.cm-activeLineGutter': { color: violet, fontWeight: '600' },
    '.cm-gutters': { backgroundColor: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.05)', color: mute },
    '.cm-activeLine': { backgroundColor: 'rgba(136,85,238,0.05)' },
    '.cm-matchingBracket': { backgroundColor: `${violet}33`, outline: `1px solid ${violet}` },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-panels': { backgroundColor: 'rgba(14,14,24,0.95)', color: dim },
    '.cm-keyword':    { color: violet,    fontWeight: '500' },
    '.cm-operator':   { color: magenta },
    '.cm-variable':   { color: text },
    '.cm-variable-2': { color: cyan },
    '.cm-function':   { color: cyan,      fontWeight: '500' },
    '.cm-string':     { color: '#AABB44' },
    '.cm-number':     { color: '#DD8833' },
    '.cm-atom':       { color: '#FF9800' },
    '.cm-boolean':    { color: violet },
    '.cm-comment':    { color: mute,      fontStyle: 'italic' },
    '.cm-tag':        { color: cyan },
    '.cm-attribute':  { color: magenta },
    '.cm-property':   { color: '#9AEAEA' },
    '.cm-type':       { color: '#5BC8CC', fontWeight: '500' },
    '.cm-builtin':    { color: '#FF9800' },
    '.cm-def':        { color: cyan },
    '.cm-punctuation':{ color: dim },
    '.cm-link':       { color: cyan, textDecoration: 'underline' },
    '.cm-header':     { color: violet, fontWeight: '700' },
    '.cm-em':         { fontStyle: 'italic' },
    '.cm-strong':     { fontWeight: '700' },
  }, { dark: true });
}

let editorView     = null;
let editorFilename = '';
let editorModified = false;
let editorOriginal = '';
let editorPaneId   = 1;

async function doSave() {
  if (!editorView) return;
  const content = editorView.state.doc.toString();
  const err = await window.go.main.App.WriteFile(editorFilename, content);
  if (err) { document.getElementById('editorStatus').textContent = `❌ ${err}`; return; }
  editorOriginal = content;
  editorModified = false;
  document.getElementById('editorModified').textContent = '';
  document.getElementById('editorStatus').textContent   = '✅ Sauvegardé';
  setTimeout(() => {
    const el = document.getElementById('editorStatus');
    if (el) el.textContent = `📄 ${editorFilename}`;
  }, 2000);
  if (typeof refreshFiles === 'function') await refreshFiles();
}

function doClose() {
  if (editorModified) {
    const ok = window.confirm(`"${editorFilename}" a été modifié.\nQuitter sans sauvegarder ?`);
    if (!ok) return;
  }
  document.getElementById('editorModal').style.display = 'none';
  editorModified = false;
  if (editorView) { editorView.destroy(); editorView = null; }
  document.getElementById(`commandInput${editorPaneId}`)?.focus();
}

function updateFooter() {
  if (!editorView) return;
  const pos  = editorView.state.selection.main.head;
  const line = editorView.state.doc.lineAt(pos);
  const col  = pos - line.from + 1;
  const el1  = document.getElementById('editorCursorPos');
  const el2  = document.getElementById('editorLineCount');
  if (el1) el1.textContent = `Ligne ${line.number}, Col ${col}`;
  if (el2) el2.textContent = `${editorView.state.doc.lines} lignes`;
}

function mountEditor(content, filename) {
  const container = document.getElementById('cmEditor');
  if (!container) return;
  if (editorView) { editorView.destroy(); editorView = null; }

  const lang = getLanguage(filename);
  const customKeymap = keymap.of([
    { key: 'Ctrl-s', run: () => { doSave(); return true; } },
    { key: 'Ctrl-q', run: () => { doClose(); return true; } },
    indentWithTab,
    ...defaultKeymap,
    ...historyKeymap,
  ]);

  const extensions = [
    basicSetup,
    buildTheme(),
    customKeymap,
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        editorModified = true;
        const el = document.getElementById('editorModified');
        if (el) el.textContent = '● Modifié';
        updateFooter();
      }
      if (update.selectionSet) updateFooter();
    }),
  ];

  if (lang) extensions.push(lang);

  editorView = new EditorView({
    state: EditorState.create({ doc: content, extensions }),
    parent: container,
  });

  updateFooter();
}

// ── API globale ───────────────────────────────────────────────
window.LeyoEditor = {
  async open(paneId, filename) {
    editorPaneId   = paneId;
    editorFilename = filename.trim();
    editorModified = false;
    const result   = await window.go.main.App.ReadFile(editorFilename);
    const elName   = document.getElementById('editorFilename');
    const elPath   = document.getElementById('editorStatus');
    const elMod    = document.getElementById('editorModified');
    if (elName) elName.textContent = editorFilename;
    if (elPath) elPath.textContent = result.exists === 'true' ? `📄 ${result.path}` : '✦ nouveau fichier';
    if (elMod)  elMod.textContent  = '';
    mountEditor(result.content || '', editorFilename);
    editorOriginal = result.content || '';
    document.getElementById('editorModal').style.display = 'flex';
    setTimeout(() => editorView?.focus(), 80);
  },
  async save()   { await doSave(); },
  close()        { doClose(); },
  reloadTheme()  { if (editorView && editorFilename) mountEditor(editorView.state.doc.toString(), editorFilename); },
  isModified:    () => editorModified,
};