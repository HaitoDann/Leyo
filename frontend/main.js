// ── État global ───────────────────────────────────────────────
let history = [];
let historyIndex = 0;
let ghostSuggestion = '';

// Split view
let splitActive = false;
let activePaneId = 1;

// État par pane
const paneState = {
  1: { historyIndex: 0, ghostSuggestion: '' },
  2: { historyIndex: 0, ghostSuggestion: '' }
};

// ── Système d'onglets ─────────────────────────────────────────
let tabs = [];
let activeTab = null;
let tabCounter = 0;

function createTab() {
  const id = ++tabCounter;
  const tab = { id, label: `Shell ${id}`, output: '', path: 'C:\\' };
  tabs.push(tab);
  renderTabs();
  switchTab(id);
  return tab;
}

function renderTabs() {
  const container = document.getElementById('tabs');
  container.innerHTML = '';
  tabs.forEach(t => {
    const div = document.createElement('div');
    div.className = 'tab' + (t.id === activeTab?.id ? ' active' : '');
    div.innerHTML = `
      <span onclick="switchTab(${t.id})">${t.label}</span>
      ${tabs.length > 1 ? `<span class="tab-close" onclick="closeTab(event,${t.id})">✕</span>` : ''}
    `;
    container.appendChild(div);
  });
}

async function switchTab(id) {
  if (activeTab) {
    activeTab.output = document.getElementById('output1').innerHTML;
    activeTab.path = document.getElementById('segPath1').textContent;
  }
  activeTab = tabs.find(t => t.id === id);
  if (!activeTab) return;

  document.getElementById('output1').innerHTML = activeTab.output;
  document.getElementById('segPath1').textContent = activeTab.path;
  document.getElementById('sidebarPath').textContent = activeTab.path;
  document.getElementById('commandInput1').value = '';
  await updateGhost(1, '');
  renderTabs();

  await window.go.main.App.RunCommand(`cd "${activeTab.path}"`);
  await refreshFiles();
  await updateGitBranch(1);
}

function closeTab(e, id) {
  e.stopPropagation();
  if (tabs.length <= 1) return;
  tabs = tabs.filter(t => t.id !== id);
  if (activeTab?.id === id) switchTab(tabs[tabs.length - 1].id);
  else renderTabs();
}

document.getElementById('tabAdd').addEventListener('click', () => createTab());

// ── Split view ────────────────────────────────────────────────
async function toggleSplit() {
  splitActive = !splitActive;
  const pane2 = document.getElementById('pane2');
  const divider = document.getElementById('splitDivider');
  const btn = document.getElementById('splitBtn');

  if (splitActive) {
    pane2.style.display = 'flex';
    divider.style.display = 'block';
    btn.classList.add('active');
    setActivePane(2);

    // Init pane 2
    const path = await window.go.main.App.GetCurrentPath();
    document.getElementById('segPath2').textContent = path;
    addLine(2, 'Leyo Shell  1.5', 'out-welcome');
    addLine(2, 'Ctrl+D pour fermer le split', 'out-muted');
    addLine(2, '', 'out-normal');
    await updateGitBranch(2);
    updateStatus(2, true);
    document.getElementById('commandInput2').focus();
  } else {
    pane2.style.display = 'none';
    divider.style.display = 'none';
    btn.classList.remove('active');
    setActivePane(1);
    document.getElementById('commandInput1').focus();
  }
}

function setActivePane(id) {
  activePaneId = id;
  document.getElementById('pane1').classList.toggle('active-pane', id === 1);
  document.getElementById('pane2').classList.toggle('active-pane', id === 2 && splitActive);
}

// Clic sur un pane → l'active
document.getElementById('pane1').addEventListener('mousedown', () => setActivePane(1));
document.getElementById('pane2').addEventListener('mousedown', () => setActivePane(2));
document.getElementById('splitBtn').addEventListener('click', toggleSplit);

// ── Recherche Ctrl+F ──────────────────────────────────────────
const searchState = {
  1: { matches: [], current: 0, originalHTML: '' },
  2: { matches: [], current: 0, originalHTML: '' }
};

function openSearch(paneId) {
  const bar = document.getElementById(`searchBar${paneId}`);
  const input = document.getElementById(`searchInput${paneId}`);
  bar.style.display = 'flex';
  input.focus();
  input.select();
}

function closeSearch(paneId) {
  const bar = document.getElementById(`searchBar${paneId}`);
  const output = document.getElementById(`output${paneId}`);
  bar.style.display = 'none';

  // Restore original HTML (supprime les highlights)
  if (searchState[paneId].originalHTML) {
    output.innerHTML = searchState[paneId].originalHTML;
    searchState[paneId].originalHTML = '';
    searchState[paneId].matches = [];
  }
  document.getElementById(`commandInput${paneId}`).focus();
}

function doSearch(paneId) {
  const query = document.getElementById(`searchInput${paneId}`).value.trim();
  const output = document.getElementById(`output${paneId}`);
  const count = document.getElementById(`searchCount${paneId}`);

  // Restaure le HTML original avant chaque nouvelle recherche
  if (searchState[paneId].originalHTML) {
    output.innerHTML = searchState[paneId].originalHTML;
  } else {
    searchState[paneId].originalHTML = output.innerHTML;
  }

  if (!query) {
    count.textContent = '';
    searchState[paneId].matches = [];
    return;
  }

  // Surligne toutes les occurrences
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  output.innerHTML = output.innerHTML.replace(regex, '<mark class="search-highlight">$1</mark>');

  const marks = output.querySelectorAll('.search-highlight');
  searchState[paneId].matches = Array.from(marks);
  searchState[paneId].current = 0;

  if (marks.length > 0) {
    count.textContent = `1 / ${marks.length}`;
    highlightCurrent(paneId);
  } else {
    count.textContent = '0 résultat';
  }
}

function highlightCurrent(paneId) {
  const state = searchState[paneId];
  state.matches.forEach((m, i) => {
    m.classList.toggle('current', i === state.current);
  });
  if (state.matches[state.current]) {
    state.matches[state.current].scrollIntoView({ block: 'center' });
  }
  document.getElementById(`searchCount${paneId}`).textContent =
    `${state.current + 1} / ${state.matches.length}`;
}

function searchNext(paneId) {
  const state = searchState[paneId];
  if (!state.matches.length) return;
  state.current = (state.current + 1) % state.matches.length;
  highlightCurrent(paneId);
}

function searchPrev(paneId) {
  const state = searchState[paneId];
  if (!state.matches.length) return;
  state.current = (state.current - 1 + state.matches.length) % state.matches.length;
  highlightCurrent(paneId);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Listeners recherche
[1, 2].forEach(id => {
  document.getElementById(`searchInput${id}`).addEventListener('input', () => doSearch(id));
  document.getElementById(`searchInput${id}`).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.shiftKey ? searchPrev(id) : searchNext(id); }
    if (e.key === 'Escape') closeSearch(id);
  });
  document.getElementById(`searchNext${id}`).addEventListener('click', () => searchNext(id));
  document.getElementById(`searchPrev${id}`).addEventListener('click', () => searchPrev(id));
  document.getElementById(`searchClose${id}`).addEventListener('click', () => closeSearch(id));
});

// ── Horloge ───────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('headerTime').textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Git branch ────────────────────────────────────────────────
async function updateGitBranch(paneId) {
  const branch = await window.go.main.App.GetGitBranch();
  const block = document.getElementById(`segGitBlock${paneId}`);
  const arrow = document.getElementById(`segGitArrow${paneId}`);
  const label = document.getElementById(`segGit${paneId}`);
  if (branch) {
    label.textContent = branch;
    block.style.display = 'flex';
    arrow.style.display = 'block';
  } else {
    block.style.display = 'none';
    arrow.style.display = 'none';
  }
}

// ── Statut ────────────────────────────────────────────────────
function updateStatus(paneId, ok) {
  const seg   = document.getElementById(`segStatusBlock${paneId}`);
  const dot   = document.getElementById(`segStatus${paneId}`);
  const arrow = seg.parentElement.querySelector('.seg-arrow-status');
  if (ok) {
    seg.className = 'seg seg-status';
    dot.textContent = '●';
    if (arrow) arrow.className = 'seg-arrow seg-arrow-status';
  } else {
    seg.className = 'seg seg-status fail';
    dot.textContent = '✕';
    if (arrow) arrow.className = 'seg-arrow seg-arrow-status fail';
  }
}

// ── Ghost text + autocomplétion ───────────────────────────────
const knownCommands = [
  'ls','rm','cp','mv','cat','clear','pwd','mkdir','touch','cd',
  'dir','del','copy','move','type','cls','echo','find','help',
  'git','git add','git commit','git push','git pull','git status',
  'git clone','git checkout','git branch','git log','git diff',
  'go build','go run','go mod','go test','go get',
  'history','exit','alias','unalias'
];

async function completePathSuggestion(input) {
  if (!input) return '';
  const cdMatch = input.match(/^(cd\s+)(.*)$/i);
  if (!cdMatch) return '';
  const prefix  = cdMatch[1];
  const partial = cdMatch[2];
  const lastSep = Math.max(partial.lastIndexOf('\\'), partial.lastIndexOf('/'));
  let dirPrefix  = '';
  let toComplete = partial;
  if (lastSep !== -1) {
    dirPrefix  = partial.slice(0, lastSep + 1);
    toComplete = partial.slice(lastSep + 1);
  }
  if (!toComplete) return '';
  const files = await window.go.main.App.ListFilesAt(dirPrefix || '.');
  const dirs  = files.filter(f => f.IsDir);
  const match = dirs.find(d =>
    d.Name.toLowerCase().startsWith(toComplete.toLowerCase()) &&
    d.Name.toLowerCase() !== toComplete.toLowerCase()
  );
  if (match) return prefix + dirPrefix + match.Name;
  return '';
}

function findGhostSuggestion(input) {
  if (!input) return '';
  const lower = input.toLowerCase();

  // Priorité 1 — commandes connues uniquement
  for (const cmd of knownCommands) {
    if (cmd.toLowerCase().startsWith(lower) && cmd.toLowerCase() !== lower) {
      return cmd;
    }
  }

  // Priorité 2 — historique, SEULEMENT si l'input contient déjà un espace
  // (ex: "git ch" → "git checkout" depuis l'historique)
  // Jamais pour un mot seul comme "cd" ou "mk"
  if (input.includes(' ')) {
    for (const cmd of history) {
      if (cmd.toLowerCase().startsWith(lower) && cmd.toLowerCase() !== lower) {
        return cmd;
      }
    }
  }

  return '';
}

async function updateGhost(paneId, input) {
  const ghost = document.getElementById(`ghostText${paneId}`);
  let suggestion = await completePathSuggestion(input);
  if (!suggestion) suggestion = findGhostSuggestion(input);
  paneState[paneId].ghostSuggestion = suggestion;

  if (suggestion && input) {
    ghost.setAttribute('data-ghost', suggestion.slice(input.length));
    ghost.style.paddingLeft = measureTextWidth(input) + 'px';
  } else {
    ghost.setAttribute('data-ghost', '');
  }
}

function measureTextWidth(text) {
  const canvas = measureTextWidth._canvas ||
    (measureTextWidth._canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  ctx.font = "13px 'JetBrains Mono', Consolas, monospace";
  return ctx.measureText(text).width;
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
  history = await window.go.main.App.GetHistory() || [];
  paneState[1].historyIndex = history.length;
  paneState[2].historyIndex = history.length;
  createTab();
  document.getElementById('commandInput1').focus();
}

// ── Output ────────────────────────────────────────────────────
function addLine(paneId, text, cls = 'out-normal') {
  const output = document.getElementById(`output${paneId}`);
  const div = document.createElement('div');
  div.className = cls;
  div.textContent = text;
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
  // Reset search state si on ajoute du contenu
  searchState[paneId].originalHTML = '';
}

// ── Sidebar ───────────────────────────────────────────────────
function getFileIcon(f) {
  if (f.IsDir) {
    const lower = f.Name.toLowerCase();
    if (lower === '.git')                        return { icon: '⎇', cls: 'type-git' };
    if (['windows','system32'].includes(lower))  return { icon: '⊞', cls: 'type-sys' };
    if (lower === 'node_modules')                return { icon: '⬡', cls: 'type-other' };
    if (lower === '$recycle.bin')                return { icon: '◌', cls: 'type-sys' };
    return { icon: '▶', cls: 'type-dir' };
  }
  switch ((f.Ext || '').toLowerCase()) {
    case '.go':                return { icon: '◆', cls: 'type-go' };
    case '.exe': case '.msi':  return { icon: '⚙', cls: 'type-exe' };
    case '.md':                return { icon: '≡', cls: 'type-md' };
    case '.yml': case '.yaml': return { icon: '◈', cls: 'type-yml' };
    case '.json':              return { icon: '◈', cls: 'type-json' };
    case '.js':  case '.ts':   return { icon: '◆', cls: 'type-json' };
    case '.css':               return { icon: '◈', cls: 'type-yml' };
    case '.html':              return { icon: '◈', cls: 'type-go' };
    default:                   return { icon: '·', cls: 'type-other' };
  }
}

async function refreshFiles() {
  const files = await window.go.main.App.ListFiles() || [];
  const list  = document.getElementById('fileList');
  const path  = await window.go.main.App.GetCurrentPath();

  document.getElementById('sidebarPath').textContent =
    path.length > 28 ? '...' + path.slice(-25) : path;

  list.innerHTML = '';
  files.forEach(f => {
    const item = document.createElement('div');
    item.className = 'file-item';
    const { icon, cls } = getFileIcon(f);
    const iconEl = document.createElement('span');
    iconEl.className = `icon ${cls}`;
    iconEl.textContent = icon;
    const nameEl = document.createElement('span');
    nameEl.className = `fname ${f.IsDir ? 'type-dir' : ''}`;
    nameEl.textContent = f.Name;

    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', f.Name);
      e.dataTransfer.effectAllowed = 'copy';
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));

    if (f.IsDir) {
      item.title = 'Glisse vers le prompt · Double-clic pour naviguer';
      item.ondblclick = () => {
        const input = document.getElementById(`commandInput${activePaneId}`);
        input.value = `cd ${f.Name}`;
        updateGhost(activePaneId, `cd ${f.Name}`);
        input.focus();
      };
    } else {
      item.title = 'Glisse vers le prompt';
    }

    item.appendChild(iconEl);
    item.appendChild(nameEl);
    list.appendChild(item);
  });
}

// ── Drag & drop sur les deux prompts ─────────────────────────
function initDragDrop() {
  [1, 2].forEach(id => {
    const bar = document.getElementById(`promptBar${id}`);

    bar.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      bar.classList.add('drop-active');
    });

    bar.addEventListener('dragleave', (e) => {
      if (!bar.contains(e.relatedTarget)) bar.classList.remove('drop-active');
    });

    bar.addEventListener('drop', (e) => {
      e.preventDefault();
      bar.classList.remove('drop-active');
      const name = e.dataTransfer.getData('text/plain');
      if (!name) return;
      const input = document.getElementById(`commandInput${id}`);
      const pos   = input.selectionStart;
      input.value = input.value.slice(0, pos) + name + input.value.slice(input.selectionEnd);
      input.selectionStart = input.selectionEnd = pos + name.length;
      updateGhost(id, input.value);
      input.focus();
      setActivePane(id);
    });
  });
}

// ── Exécution commande ────────────────────────────────────────
async function runCommand(paneId, input) {
  if (!input) return;

  await updateGhost(paneId, '');
  const path = document.getElementById(`segPath${paneId}`).textContent;
  addLine(paneId, `${path}  ${input}`, 'out-cmd');

  if (input.trim() === 'exit') { window.runtime.Quit(); return; }

  if (input.trim() === 'clear') {
    document.getElementById(`output${paneId}`).innerHTML = '';
    searchState[paneId].originalHTML = '';
    updateStatus(paneId, true);
    return;
  }

  if (input.trim() === 'history') {
    history.forEach((cmd, i) => addLine(paneId, `  ${i + 1}  ${cmd}`, 'out-muted'));
    updateStatus(paneId, true);
    return;
  }

  if (input.trim() === 'alias') {
    const aliases = await window.go.main.App.GetAliases();
    if (!Object.keys(aliases).length) addLine(paneId, '  Aucun alias.', 'out-muted');
    else Object.entries(aliases).forEach(([k, v]) => addLine(paneId, `  ${k}  →  ${v}`, 'out-muted'));
    updateStatus(paneId, true);
    return;
  }

  if (input.trim().startsWith('alias ')) {
    const raw = input.trim().slice(6);
    const eq  = raw.indexOf('=');
    if (eq !== -1) {
      const name = raw.slice(0, eq).trim();
      const cmd  = raw.slice(eq + 1).replace(/"/g, '').trim();
      const err  = await window.go.main.App.SaveAlias(name, cmd);
      if (err) { addLine(paneId, '❌ ' + err, 'out-error'); updateStatus(paneId, false); }
      else     { addLine(paneId, `✅ alias ${name} → ${cmd}`, 'out-success'); updateStatus(paneId, true); }
    } else {
      addLine(paneId, '❌ Syntaxe : alias nom="commande"', 'out-error');
      updateStatus(paneId, false);
    }
    return;
  }

  if (input.trim().startsWith('unalias ')) {
    const name = input.trim().slice(8).trim();
    await window.go.main.App.DeleteAlias(name);
    addLine(paneId, `✅ alias supprimé : ${name}`, 'out-success');
    updateStatus(paneId, true);
    return;
  }

  await window.go.main.App.SaveHistory(input);
  history = await window.go.main.App.GetHistory() || [];
  paneState[1].historyIndex = history.length;
  paneState[2].historyIndex = history.length;

  const result = await window.go.main.App.RunCommand(input);

  const hasError = !!result.error;
  if (result.error)      addLine(paneId, '❌ ' + result.error, 'out-error');
  if (result.suggestion) addSuggestion(paneId, result.suggestion, input);
  if (result.output)     addLine(paneId, result.output, 'out-normal');

  updateStatus(paneId, !hasError);

  const newPath = await window.go.main.App.GetCurrentPath();
  document.getElementById(`segPath${paneId}`).textContent = newPath;

  if (paneId === 1) await refreshFiles();
  await updateGitBranch(paneId);
}

// ── Suggestion intelligente ───────────────────────────────────
function addSuggestion(paneId, suggestion, originalInput) {
  const output = document.getElementById(`output${paneId}`);
  const div = document.createElement('div');
  div.className = 'out-suggestion';
  div.innerHTML = `
    💡 <span style="color:var(--text-mute)">Vouliez-vous dire</span>
    <span class="suggestion-word">${suggestion}</span>
    <button class="suggestion-btn" onclick="acceptSuggestion(${paneId},'${suggestion}','${originalInput}')">Exécuter</button>
    <button class="suggestion-btn dismiss" onclick="this.parentElement.remove()">Ignorer</button>
  `;
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
}

async function acceptSuggestion(paneId, suggestion, originalInput) {
  const parts = originalInput.trim().split(' ');
  parts[0] = suggestion;
  document.querySelector('.out-suggestion')?.remove();
  await runCommand(paneId, parts.join(' '));
}

// ── Gestion clavier pour les deux panes ───────────────────────
function setupPane(paneId) {
  const input = document.getElementById(`commandInput${paneId}`);

  input.addEventListener('input', async (e) => {
    await updateGhost(paneId, e.target.value);
  });

  input.addEventListener('keydown', async (e) => {

    // Ctrl+F → recherche dans ce pane
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      openSearch(paneId);
      return;
    }

    // Ctrl+D → toggle split
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      toggleSplit();
      return;
    }

    if (e.ctrlKey && e.key === 'c') {
      const sel = window.getSelection().toString();
      if (sel) { e.preventDefault(); await navigator.clipboard.writeText(sel); return; }
      input.value = '';
      await updateGhost(paneId, '');
      return;
    }

    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      const text = await navigator.clipboard.readText();
      const pos  = input.selectionStart;
      input.value = input.value.slice(0, pos) + text + input.value.slice(input.selectionEnd);
      input.selectionStart = input.selectionEnd = pos + text.length;
      await updateGhost(paneId, input.value);
      return;
    }

    if (e.ctrlKey && e.key === 'a') { e.preventDefault(); input.select(); return; }
    if (e.ctrlKey && e.key === 't') { e.preventDefault(); createTab(); return; }
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      if (activeTab) closeTab(new Event('click'), activeTab.id);
      return;
    }

    const ghost = paneState[paneId].ghostSuggestion;
    if ((e.key === 'ArrowRight' || e.key === 'Tab') && ghost) {
      if (input.selectionStart === input.value.length) {
        e.preventDefault();
        input.value = ghost;
        await updateGhost(paneId, '');
        return;
      }
    }

    if (e.key === 'Enter') {
      const cmd = input.value.trim();
      input.value = '';
      await updateGhost(paneId, '');
      await runCommand(paneId, cmd);

    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const state = paneState[paneId];
      if (state.historyIndex > 0) {
        state.historyIndex--;
        input.value = history[state.historyIndex];
        await updateGhost(paneId, input.value);
      }

    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const state = paneState[paneId];
      if (state.historyIndex < history.length - 1) {
        state.historyIndex++;
        input.value = history[state.historyIndex];
        await updateGhost(paneId, input.value);
      } else {
        state.historyIndex = history.length;
        input.value = '';
        await updateGhost(paneId, '');
      }
    }
  });

  // Focus → active le bon pane
  input.addEventListener('focus', () => setActivePane(paneId));
}

// ── Message de bienvenue ──────────────────────────────────────
async function showWelcome() {
  addLine(1, 'Leyo Shell  1.5', 'out-welcome');
  addLine(1, 'Ctrl+T session  ·  Ctrl+D split  ·  Ctrl+F recherche  ·  Tab complétion', 'out-muted');
  addLine(1, '', 'out-normal');

  const path = await window.go.main.App.GetCurrentPath();
  document.getElementById('segPath1').textContent = path;
  document.getElementById('sidebarPath').textContent = path;
  await refreshFiles();
  await updateGitBranch(1);
  updateStatus(1, true);

  initDragDrop();
}

// ── Démarrage ─────────────────────────────────────────────────
setupPane(1);
setupPane(2);

document.addEventListener('click', (e) => {
  const p1 = document.getElementById('pane1');
  const p2 = document.getElementById('pane2');
  if (p1.contains(e.target)) { setActivePane(1); }
  else if (p2.contains(e.target)) { setActivePane(2); }
});

init().then(() => showWelcome());