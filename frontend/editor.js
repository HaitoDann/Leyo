// ── CodeMirror 6 — Éditeur Leyo ──────────────────────────────
import { EditorView, basicSetup } from 'https://esm.sh/codemirror@6.0.1';
import { EditorState }            from 'https://esm.sh/@codemirror/state@6.4.1';
import { javascript }             from 'https://esm.sh/@codemirror/lang-javascript@6.2.2';
import { python }                 from 'https://esm.sh/@codemirror/lang-python@6.1.6';
import { json }                   from 'https://esm.sh/@codemirror/lang-json@6.0.1';
import { markdown }               from 'https://esm.sh/@codemirror/lang-markdown@6.2.5';
import { html }                   from 'https://esm.sh/@codemirror/lang-html@6.4.9';
import { css }                    from 'https://esm.sh/@codemirror/lang-css@6.2.1';
import { StreamLanguage }         from 'https://esm.sh/@codemirror/language@6.10.1';
import { go }                     from 'https://esm.sh/@codemirror/legacy-modes@6.4.0/src/go';
import { keymap }                 from 'https://esm.sh/@codemirror/view@6.26.3';
import { defaultKeymap, historyKeymap } from 'https://esm.sh/@codemirror/commands@6.6.0';

// ── Détecte le langage selon l'extension ─────────────────────
function getLanguage(filename) {
  const ext = filename.split('.').pop().toLowerCase();
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
  return map[ext] || [];
}

// ── Thème dynamique qui suit les CSS vars Leyo ────────────────
function buildTheme() {
  const s = getComputedStyle(document.documentElement);
  const cyan    = s.getPropertyValue('--cyan').trim()    || '#5BC8E8';
  const violet  = s.getPropertyValue('--violet').trim()  || '#8855EE';
  const magenta = s.getPropertyValue('--magenta').trim() || '#CC44AA';
  const bg      = s.getPropertyValue('--bg').trim()      || '#08080E';
  const text    = s.getPropertyValue('--text').trim()    || '#D8D8E8';
  const mute    = s.getPropertyValue('--text-mute').trim()|| '#606080';
  const dim     = s.getPropertyValue('--text-dim').trim() || '#9999BB';
  const border  = 'rgba(255,255,255,0.05)';

  return EditorView.theme({
    // Conteneur principal
    '&': {
      height: '100%',
      backgroundColor: bg,
      color: text,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
      fontSize: '13px',
    },
    // Zone de contenu
    '.cm-content': {
      padding: '12px 16px',
      caretColor: magenta,
      lineHeight: '1.7',
    },
    // Curseur
    '.cm-cursor': { borderLeftColor: magenta, borderLeftWidth: '2px' },

    // Sélection
    '.cm-selectionBackground, ::selection': {
      backgroundColor: `${violet}44 !important`,
    },
    '.cm-focused .cm-selectionBackground': {
      backgroundColor: `${violet}55 !important`,
    },

    // Numéros de lignes (remplace notre gutter maison)
    '.cm-lineNumbers .cm-gutterElement': {
      color: mute,
      fontSize: '12px',
      paddingRight: '12px',
      minWidth: '40px',
    },
    '.cm-activeLineGutter': { color: violet, fontWeight: '600' },
    '.cm-gutters': {
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRight: `1px solid ${border}`,
      color: mute,
    },

    // Ligne active
    '.cm-activeLine': { backgroundColor: 'rgba(136,85,238,0.05)' },

    // Correspondance de brackets
    '.cm-matchingBracket': {
      backgroundColor: `${violet}33`,
      outline: `1px solid ${violet}`,
    },

    // Scrollbar
    '.cm-scroller': { overflow: 'auto' },

    // Recherche
    '.cm-searchMatch': { backgroundColor: 'rgba(221,170,51,0.3)' },
    '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: 'rgba(221,170,51,0.6)' },

    // Panneau (recherche, etc.)
    '.cm-panels': { backgroundColor: 'rgba(14,14,24,0.95)', color: dim },

    // ── Tokens de coloration ──────────────────────────────────
    '.cm-keyword':   { color: violet,  fontWeight: '500' },
    '.cm-operator':  { color: magenta },
    '.cm-variable':  { color: text },
    '.cm-variable-2':{ color: cyan },
    '.cm-variable-3':{ color: cyan },
    '.cm-function':  { color: cyan,    fontWeight: '500' },
    '.cm-string':    { color: '#AABB44' },
    '.cm-string-2':  { color: '#AABB44' },
    '.cm-number':    { color: '#DD8833' },
    '.cm-atom':      { color: '#FF9800' },
    '.cm-boolean':   { color: violet },
    '.cm-comment':   { color: mute,    fontStyle: 'italic' },
    '.cm-meta':      { color: dim },
    '.cm-tag':       { color: cyan },
    '.cm-attribute': { color: magenta },
    '.cm-property':  { color: '#9AEAEA' },
    '.cm-qualifier': { color: violet },
    '.cm-type':      { color: '#5BC8CC', fontWeight: '500' },
    '.cm-builtin':   { color: '#FF9800' },
    '.cm-def':       { color: cyan },
    '.cm-punctuation':{ color: dim },
    '.cm-link':      { color: cyan, textDecoration: 'underline' },
    '.cm-header':    { color: violet, fontWeight: '700' },
    '.cm-hr':        { color: mute },
    '.cm-em':        { fontStyle: 'italic' },
    '.cm-strong':    { fontWeight: '700' },
    '.cm-code':      { color: '#9AEAEA', fontFamily: 'inherit' },
  }, { dark: true });
}

// ── Instance globale de l'éditeur ─────────────────────────────
let editorView = null;
let editorFilename = '';
let editorModified = false;
let editorOriginal = '';
let editorPaneId   = 1;

// ── Crée ou recrée l'éditeur ──────────────────────────────────
function mountEditor(content, filename) {
  const container = document.getElementById('cmEditor');
  if (!container) return;

  // Détruit l'instance précédente
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }

  const lang = getLanguage(filename);

  const extensions = [
    basicSetup,
    buildTheme(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        editorModified = true;
        document.getElementById('editorModified').textContent = '● Modifié';
        // Met à jour le footer
        const pos   = update.state.selection.main.head;
        const line  = update.state.doc.lineAt(pos);
        const col   = pos - line.from + 1;
        document.getElementById('editorCursorPos').textContent =
          `Ligne ${line.number}, Col ${col}`;
        document.getElementById('editorLineCount').textContent =
          `${update.state.doc.lines} lignes`;
      }
    }),
    // Maj position curseur au clic
    EditorView.domEventHandlers({
      click: () => updateFooterPos(),
      keyup: () => updateFooterPos(),
    }),
  ];

  // Ajoute le langage seulement si détecté
  if (lang && !Array.isArray(lang)) extensions.push(lang);
  else if (Array.isArray(lang) && lang.length) extensions.push(...lang);

  editorView = new EditorView({
    state: EditorState.create({ doc: content, extensions }),
    parent: container,
  });

  updateFooterPos();
}

// ── Met à jour la position curseur dans le footer ─────────────
function updateFooterPos() {
  if (!editorView) return;
  const pos  = editorView.state.selection.main.head;
  const line = editorView.state.doc.lineAt(pos);
  const col  = pos - line.from + 1;
  document.getElementById('editorCursorPos').textContent =
    `Ligne ${line.number}, Col ${col}`;
  document.getElementById('editorLineCount').textContent =
    `${editorView.state.doc.lines} lignes`;
}

// ── API exposée globalement ───────────────────────────────────
window.LeyoEditor = {

  // Ouvre l'éditeur avec un fichier
  async open(paneId, filename) {
    editorPaneId   = paneId;
    editorFilename = filename.trim();
    editorModified = false;

    const result = await window.go.main.App.ReadFile(editorFilename);

    document.getElementById('editorFilename').textContent = editorFilename;
    document.getElementById('editorStatus').textContent =
      result.exists === 'true' ? `📄 ${result.path}` : '✦ nouveau fichier';
    document.getElementById('editorModified').textContent = '';

    // Monte CodeMirror
    mountEditor(result.content || '', editorFilename);

    editorOriginal = result.content || '';

    document.getElementById('editorModal').style.display = 'flex';

    // Focus sur l'éditeur
    setTimeout(() => editorView?.focus(), 50);
  },

  // Sauvegarde
  async save() {
    if (!editorView) return;
    const content = editorView.state.doc.toString();
    const err = await window.go.main.App.WriteFile(editorFilename, content);

    if (err) {
      document.getElementById('editorStatus').textContent = `❌ ${err}`;
      return;
    }

    editorOriginal = content;
    editorModified = false;
    document.getElementById('editorModified').textContent = '';
    document.getElementById('editorStatus').textContent = '✅ Sauvegardé';
    setTimeout(() => {
      document.getElementById('editorStatus').textContent = `📄 ${editorFilename}`;
    }, 2000);

    // Rafraîchit la sidebar
    if (typeof refreshFiles === 'function') await refreshFiles();
  },

  // Ferme l'éditeur
  close() {
    if (editorModified) {
      const ok = window.confirm(
        `Le fichier "${editorFilename}" a été modifié.\nQuitter sans sauvegarder ?`
      );
      if (!ok) return;
    }
    document.getElementById('editorModal').style.display = 'none';
    editorModified = false;
    if (editorView) { editorView.destroy(); editorView = null; }
    document.getElementById(`commandInput${editorPaneId}`)?.focus();
  },

  // Recharge le thème quand l'utilisateur change de thème Leyo
  reloadTheme() {
    if (!editorView || !editorFilename) return;
    const content = editorView.state.doc.toString();
    mountEditor(content, editorFilename);
  },

  isModified: () => editorModified,
};