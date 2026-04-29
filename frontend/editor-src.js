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

// ── Nom lisible du langage pour la barre d'état ───────────────
function getLanguageName(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map = {
    'js': 'JavaScript', 'ts': 'TypeScript',
    'jsx': 'JSX', 'tsx': 'TSX',
    'py': 'Python', 'pyw': 'Python',
    'json': 'JSON', 'md': 'Markdown', 'mdx': 'Markdown',
    'html': 'HTML', 'htm': 'HTML',
    'css': 'CSS', 'scss': 'SCSS',
    'go': 'Go',
    'txt': 'Texte brut',
  };
  return map[ext] || ext.toUpperCase() || 'Texte brut';
}

// ── Thème CodeMirror — palette douce type One Dark ────────────
function buildTheme() {
  const s       = getComputedStyle(document.documentElement);
  const cyan    = s.getPropertyValue('--cyan').trim()     || '#5BC8E8';
  const violet  = s.getPropertyValue('--violet').trim()   || '#8855EE';
  const magenta = s.getPropertyValue('--magenta').trim()  || '#CC44AA';
  const bg      = s.getPropertyValue('--bg').trim()       || '#08080E';
  const text    = s.getPropertyValue('--text').trim()     || '#D8D8E8';
  const mute    = s.getPropertyValue('--text-mute').trim()|| '#606080';

  // Couleurs de syntaxe pastel — One Dark inspiré
  const syn = {
    keyword:   '#C678DD',  // violet doux
    fn:        '#61AFEF',  // bleu clair
    string:    '#98C379',  // vert sauge
    number:    '#D19A66',  // orange paille
    comment:   '#5C6370',  // gris
    operator:  '#56B6C2',  // cyan doux
    tag:       '#E06C75',  // rouge rosé
    attr:      '#D19A66',  // orange
    property:  '#E5C07B',  // jaune paille
    type:      '#E5C07B',  // jaune paille
    builtin:   '#E5C07B',
    punctuation:'#ABB2BF', // gris clair
    variable:  '#ABB2BF',
    def:       '#61AFEF',
    link:      '#61AFEF',
  };

  // Fond légèrement différent du fond principal pour la gouttière
  const bgGutter   = 'rgba(0,0,0,0.25)';
  const bgActive   = 'rgba(255,255,255,0.04)';
  const borderCol  = 'rgba(255,255,255,0.05)';

  return EditorView.theme({
    // ── Conteneur ────────────────────────────────────────────
    '&': {
      height: '100%',
      backgroundColor: bg,
      color: text,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontSize: '13px',
      fontVariantLigatures: 'common-ligatures',
    },
    '.cm-content': {
      padding: '14px 0',
      caretColor: magenta,
      lineHeight: '1.75',   // ← respiration
    },

    // ── Curseur ───────────────────────────────────────────────
    '.cm-cursor': {
      borderLeftColor: magenta,
      borderLeftWidth: '2px',
    },

    // ── Sélection ─────────────────────────────────────────────
    '.cm-selectionBackground': {
      backgroundColor: `${violet}33 !important`,
    },
    '.cm-focused .cm-selectionBackground': {
      backgroundColor: `${violet}44 !important`,
    },
    '::selection': {
      backgroundColor: `${violet}44`,
    },

    // ── Gouttière numéros de lignes ───────────────────────────
    '.cm-gutters': {
      backgroundColor: bgGutter,
      borderRight: `1px solid ${borderCol}`,
      color: mute,
      minWidth: '48px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      color: '#3D4350',      // gris très discret
      fontSize: '11.5px',
      paddingRight: '14px',
      paddingLeft: '6px',
      lineHeight: '1.75',
    },
    // Numéro de ligne active — mis en valeur
    '.cm-activeLineGutter': {
      color: cyan,
      fontWeight: '600',
      backgroundColor: bgActive,
    },

    // ── Ligne active — highlight subtil ──────────────────────
    '.cm-activeLine': {
      backgroundColor: bgActive,
    },

    // ── Brackets ──────────────────────────────────────────────
    '.cm-matchingBracket': {
      backgroundColor: `${violet}28`,
      outline: `1px solid ${violet}66`,
      borderRadius: '2px',
    },

    // ── Scroller / panneau ───────────────────────────────────
    '.cm-scroller': { overflow: 'auto' },
    '.cm-panels':   { backgroundColor: 'rgba(10,10,18,0.98)', color: text },

    // ── Tokens de syntaxe — palette douce ────────────────────
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
    '.cm-link':        { color: syn.link, textDecoration: 'underline' },
    '.cm-header':      { color: cyan,            fontWeight: '700' },
    '.cm-hr':          { color: mute },
    '.cm-em':          { fontStyle: 'italic' },
    '.cm-strong':      { fontWeight: '700' },
    '.cm-code':        { color: syn.string,      fontFamily: 'inherit' },
    '.cm-invalid':     { color: '#FF5555',       textDecoration: 'underline wavy' },
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
  if (err) {
    setStatus(`❌ ${err}`);
    return;
  }
  editorOriginal = content;
  editorModified = false;
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
  el.textContent  = mod ? '●' : '';
  el.title        = mod ? 'Modifications non sauvegardées' : '';
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

// ── API globale ───────────────────────────────────────────────
window.LeyoEditor = {

  async open(paneId, filename) {
    editorPaneId   = paneId;
    editorFilename = filename.trim();
    editorModified = false;

    const result = await window.go.main.App.ReadFile(editorFilename);

    // Header — nom centré
    const elName = document.getElementById('editorFilename');
    if (elName) elName.textContent = editorFilename;

    // Statut — chemin discret ou nouveau fichier
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