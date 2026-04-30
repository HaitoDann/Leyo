import { EditorView, basicSetup } from 'codemirror';
import { keymap }                 from '@codemirror/view';
import { EditorState }            from '@codemirror/state';
import { javascript }             from '@codemirror/lang-javascript';
import { python }                 from '@codemirror/lang-python';
import { json }                   from '@codemirror/lang-json';
import { markdown }               from '@codemirror/lang-markdown';
import { html }                   from '@codemirror/lang-html';
import { css }                    from '@codemirror/lang-css';
import { StreamLanguage }         from '@codemirror/language';
import { go }                     from '@codemirror/legacy-modes/mode/go';
import { defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';

// ── Détecte le langage ────────────────────────────────────────
function getLanguage(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map = {
    'js':   javascript(),
    'ts':   javascript({ typescript: true }),
    'jsx':  javascript({ jsx: true }),
    'tsx':  javascript({ jsx: true, typescript: true }),
    'py':   python(),
    'pyw':  python(),
    'json': json(),
    'md':   markdown(),
    'mdx':  markdown(),
    'html': html(),
    'htm':  html(),
    'css':  css(),
    'scss': css(),
    'go':   StreamLanguage.define(go),
  };
  return map[ext] || null;
}

// ── Nom lisible du langage ────────────────────────────────────
function getLanguageName(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map = {
    'js': 'JavaScript', 'ts': 'TypeScript',
    'jsx': 'JSX', 'tsx': 'TSX',
    'py': 'Python', 'pyw': 'Python',
    'json': 'JSON',
    'md': 'Markdown', 'mdx': 'Markdown',
    'html': 'HTML', 'htm': 'HTML',
    'css': 'CSS', 'scss': 'SCSS',
    'go': 'Go',
    'txt': 'Texte brut',
  };
  return map[ext] || (ext ? ext.toUpperCase() : 'Texte brut');
}

// ── Thème Tokyo Night ─────────────────────────────────────────
function buildTheme() {
  const s       = getComputedStyle(document.documentElement);
  const violet  = s.getPropertyValue('--violet').trim()   || '#8855EE';
  const magenta = s.getPropertyValue('--magenta').trim()  || '#CC44AA';

  // Palette Tokyo Night — températures équilibrées
  const syn = {
    keyword:     '#BB9AF7',  // violet pastel — if, def, return
    fn:          '#7DCFFF',  // cyan clair — fonctions
    string:      '#9ECE6A',  // vert émeraude doux — strings
    number:      '#FF9E64',  // orange pastel — nombres
    comment:     '#565F89',  // gris-bleu discret — commentaires
    operator:    '#89DDFF',  // cyan pâle — opérateurs
    tag:         '#F7768E',  // rose — balises HTML
    attr:        '#FF9E64',  // orange — attributs
    property:    '#73DACA',  // turquoise — propriétés objet
    type:        '#2AC3DE',  // bleu-cyan — types
    builtin:     '#FF9E64',  // orange — builtins
    punctuation: '#C0CAF5',  // lavande claire — ponctuation
    variable:    '#C0CAF5',  // lavande claire — variables
    def:         '#7DCFFF',  // cyan — définitions
    link:        '#7DCFFF',
  };

  // Fonds VS Code sombre — gris-bleu, jamais noir pur
  const bgEditor = '#1E1E2E';  // fond éditeur
  const bgGutter = '#181825';  // gouttière légèrement plus sombre
  const bgActive = '#2A2A3D';  // ligne active
  const textMain = '#C0CAF5';  // texte principal — lavande claire

  return EditorView.theme({

    // ── Conteneur ────────────────────────────────────────────
    '&': {
      height: '100%',
      backgroundColor: bgEditor,
      color: textMain,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontSize: '13px',
      fontVariantLigatures: 'common-ligatures',
    },

    '.cm-content': {
      padding: '14px 0',
      caretColor: '#7DCFFF',
      lineHeight: '1.75',
    },

    // ── Curseur ───────────────────────────────────────────────
    '.cm-cursor': {
      borderLeftColor: '#7DCFFF',
      borderLeftWidth: '2px',
    },

    // ── Sélection ─────────────────────────────────────────────
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(187,154,247,0.2) !important',
    },
    '.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(187,154,247,0.25) !important',
    },
    '::selection': {
      backgroundColor: 'rgba(187,154,247,0.2)',
    },

    // ── Gouttière — effet de profondeur ───────────────────────
    '.cm-gutters': {
      backgroundColor: bgGutter,
      borderRight: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '2px 0 8px rgba(0,0,0,0.35)',
      color: '#3B4261',
      minWidth: '52px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      color: '#3B4261',
      fontSize: '11.5px',
      paddingRight: '16px',
      paddingLeft: '8px',
      lineHeight: '1.75',
      opacity: '0.6',
    },

    // Numéro ligne active — pleine opacité + accent
    '.cm-activeLineGutter': {
      color: '#7DCFFF',
      fontWeight: '600',
      backgroundColor: bgActive,
      opacity: '1',
    },

    // ── Ligne active ──────────────────────────────────────────
    '.cm-activeLine': {
      backgroundColor: bgActive,
      boxShadow: 'inset 2px 0 0 rgba(125,207,255,0.35)',
    },

    // ── Brackets ──────────────────────────────────────────────
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(187,154,247,0.2)',
      outline: '1px solid rgba(187,154,247,0.5)',
      borderRadius: '2px',
    },

    // ── Divers ────────────────────────────────────────────────
    '.cm-scroller': { overflow: 'auto' },
    '.cm-panels':   { backgroundColor: '#16161E', color: textMain },
    '.cm-tooltip':  {
      backgroundColor: '#1A1A2E',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '6px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(255,158,100,0.25)',
      outline: '1px solid rgba(255,158,100,0.4)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(255,158,100,0.5)',
    },

    // ── Tokens syntaxiques — Tokyo Night ─────────────────────
    '.cm-keyword':     { color: syn.keyword,     fontWeight: '500' },
    '.cm-operator':    { color: syn.operator },
    '.cm-variable':    { color: syn.variable },
    '.cm-variable-2':  { color: syn.fn },
    '.cm-variable-3':  { color: syn.fn },
    '.cm-function':    { color: syn.fn,          fontWeight: '500' },
    '.cm-string':      { color: syn.string },
    '.cm-string-2':    { color: syn.string },
    '.cm-number':      { color: syn.number },
    '.cm-atom':        { color: syn.number },
    '.cm-boolean':     { color: syn.keyword },
    '.cm-comment':     { color: syn.comment,     fontStyle: 'italic' },
    '.cm-meta':        { color: syn.comment },
    '.cm-tag':         { color: syn.tag },
    '.cm-attribute':   { color: syn.attr },
    '.cm-property':    { color: syn.property },
    '.cm-qualifier':   { color: syn.keyword },
    '.cm-type':        { color: syn.type,        fontWeight: '500' },
    '.cm-builtin':     { color: syn.builtin },
    '.cm-def':         { color: syn.def },
    '.cm-punctuation': { color: syn.punctuation },
    '.cm-link':        { color: syn.link,        textDecoration: 'underline' },
    '.cm-header':      { color: syn.fn,          fontWeight: '700' },
    '.cm-hr':          { color: syn.comment },
    '.cm-em':          { fontStyle: 'italic',    color: syn.string },
    '.cm-strong':      { fontWeight: '700',      color: syn.keyword },
    '.cm-code':        { color: syn.property,    fontFamily: 'inherit' },
    '.cm-invalid':     { color: '#F7768E',       textDecoration: 'underline wavy' },

  }, { dark: true });
}

// ── État de l'éditeur ─────────────────────────────────────────
let editorView     = null;
let editorFilename = '';
let editorModified = false;
let editorOriginal = '';
let editorPaneId   = 1;

// ── Sauvegarde ────────────────────────────────────────────────
async function doSave() {
  if (!editorView) return;
  const content = editorView.state.doc.toString();
  const err     = await window.go.main.App.WriteFile(editorFilename, content);
  if (err) { setStatus(`❌ ${err}`); return; }
  editorOriginal = content;
  setModified(false);
  setStatus('✓ Sauvegardé');
  setTimeout(() => setStatus(''), 2000);
  if (typeof refreshFiles === 'function') await refreshFiles();
}

// ── Fermeture ─────────────────────────────────────────────────
function doClose() {
  if (editorModified) {
    const ok = window.confirm(`"${editorFilename}" a des modifications non sauvegardées.\nFermer quand même ?`);
    if (!ok) return;
  }
  document.getElementById('editorModal').style.display = 'none';
  editorModified = false;
  if (editorView) { editorView.destroy(); editorView = null; }
  document.getElementById(`commandInput${editorPaneId}`)?.focus();
}

// ── Helpers UI ────────────────────────────────────────────────
function setStatus(msg) {
  const el = document.getElementById('editorStatus');
  if (el) el.textContent = msg;
}

function setModified(mod) {
  editorModified = mod;
  const el = document.getElementById('editorModified');
  if (!el) return;
  el.textContent = mod ? '●' : '';
  el.title       = mod ? 'Modifications non sauvegardées' : '';
}

function updateFooter() {
  if (!editorView) return;
  const pos  = editorView.state.selection.main.head;
  const line = editorView.state.doc.lineAt(pos);
  const col  = pos - line.from + 1;
  const el1  = document.getElementById('editorCursorPos');
  const el2  = document.getElementById('editorLineCount');
  if (el1) el1.textContent = `Ln ${line.number}  Col ${col}`;
  if (el2) el2.textContent = `${editorView.state.doc.lines} lignes`;
}

function updateLanguageFooter(filename) {
  const el = document.getElementById('editorLang');
  if (el) el.textContent = getLanguageName(filename);
}

// ── Monte l'éditeur ───────────────────────────────────────────
function mountEditor(content, filename) {
  const container = document.getElementById('cmEditor');
  if (!container) return;
  if (editorView) { editorView.destroy(); editorView = null; }

  const lang = getLanguage(filename);

  const customKeymap = keymap.of([
    { key: 'Ctrl-s', run: () => { doSave();  return true; } },
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
        setModified(true);
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
  updateLanguageFooter(filename);
}

// ── API globale exposée à main.js ─────────────────────────────
window.LeyoEditor = {

  async open(paneId, filename) {
    editorPaneId   = paneId;
    editorFilename = filename.trim();
    editorModified = false;

    const result = await window.go.main.App.ReadFile(editorFilename);

    const elName = document.getElementById('editorFilename');
    if (elName) elName.textContent = editorFilename;

    setStatus(result.exists === 'true' ? result.path : '✦ Nouveau fichier');
    setModified(false);

    mountEditor(result.content || '', editorFilename);
    editorOriginal = result.content || '';

    document.getElementById('editorModal').style.display = 'flex';
    setTimeout(() => editorView?.focus(), 80);
  },

  async save()  { await doSave(); },
  close()       { doClose(); },
  reloadTheme() {
    if (editorView && editorFilename) {
      mountEditor(editorView.state.doc.toString(), editorFilename);
    }
  },
  isModified: () => editorModified,
};