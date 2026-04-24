// ── État global ───────────────────────────────────────────────
let history = [];
let historyIndex = 0;
let ghostSuggestion = '';
let lastCommandOk = true;

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
    activeTab.output = document.getElementById('output').innerHTML;
    activeTab.path = document.getElementById('segPath').textContent;
  }
  activeTab = tabs.find(t => t.id === id);
  if (!activeTab) return;

  document.getElementById('output').innerHTML = activeTab.output;
  document.getElementById('segPath').textContent = activeTab.path;
  document.getElementById('sidebarPath').textContent = activeTab.path;
  document.getElementById('commandInput').value = '';
  await updateGhost('');
  renderTabs();

  await window.go.main.App.RunCommand(`cd "${activeTab.path}"`);
  await refreshFiles();
  await updateGitBranch();
}

function closeTab(e, id) {
  e.stopPropagation();
  if (tabs.length <= 1) return;
  tabs = tabs.filter(t => t.id !== id);
  if (activeTab?.id === id) switchTab(tabs[tabs.length - 1].id);
  else renderTabs();
}

document.getElementById('tabAdd').addEventListener('click', () => createTab());

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
async function updateGitBranch() {
  const branch = await window.go.main.App.GetGitBranch();
  const block = document.getElementById('segGitBlock');
  const arrow = document.getElementById('segGitArrow');
  const label = document.getElementById('segGit');
  if (branch) {
    label.textContent = branch;
    block.style.display = 'flex';
    arrow.style.display = 'block';
  } else {
    block.style.display = 'none';
    arrow.style.display = 'none';
  }
}

// ── Statut dernière commande ──────────────────────────────────
function updateStatus(ok) {
  lastCommandOk = ok;
  const seg   = document.getElementById('segStatusBlock');
  const arrow = document.querySelector('.seg-arrow-status');
  const dot   = document.getElementById('segStatus');
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

// ── Ghost text + autocomplétion chemins multi-niveaux ─────────
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
  for (const cmd of [...knownCommands, ...history]) {
    if (cmd.toLowerCase().startsWith(lower) && cmd.toLowerCase() !== lower) return cmd;
  }
  return '';
}

async function updateGhost(input) {
  const ghost = document.getElementById('ghostText');

  let suggestion = await completePathSuggestion(input);
  if (!suggestion) suggestion = findGhostSuggestion(input);

  ghostSuggestion = suggestion;

  if (ghostSuggestion && input) {
    ghost.setAttribute('data-ghost', ghostSuggestion.slice(input.length));
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
  historyIndex = history.length;
  createTab();
  document.getElementById('commandInput').focus();
}

// ── Output ────────────────────────────────────────────────────
function addLine(text, cls = 'out-normal') {
  const output = document.getElementById('output');
  const div = document.createElement('div');
  div.className = cls;
  div.textContent = text;
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
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

    // ── Drag & drop ──────────────────────────────
    item.draggable = true;

    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', f.Name);
      e.dataTransfer.effectAllowed = 'copy';
      item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
    // ─────────────────────────────────────────────

    if (f.IsDir) {
      item.title = 'Glisse vers le prompt · Double-clic pour naviguer';
      item.ondblclick = () => {
        const input = document.getElementById('commandInput');
        input.value = `cd ${f.Name}`;
        updateGhost(`cd ${f.Name}`);
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

// ── Zone de drop sur le prompt ────────────────────────────────
function initDragDrop() {
  const promptBar = document.querySelector('.prompt-bar');

  promptBar.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    promptBar.classList.add('drop-active');
  });

  promptBar.addEventListener('dragleave', (e) => {
    // Évite le flickering quand on survole un enfant
    if (!promptBar.contains(e.relatedTarget)) {
      promptBar.classList.remove('drop-active');
    }
  });

  promptBar.addEventListener('drop', (e) => {
    e.preventDefault();
    promptBar.classList.remove('drop-active');

    const name = e.dataTransfer.getData('text/plain');
    if (!name) return;

    const input  = document.getElementById('commandInput');
    const pos    = input.selectionStart;
    const before = input.value.slice(0, pos);
    const after  = input.value.slice(pos);

    // Insère le nom à la position du curseur
    input.value = before + name + after;
    input.selectionStart = input.selectionEnd = pos + name.length;
    updateGhost(input.value);
    input.focus();
  });
}

// ── Exécution commande ────────────────────────────────────────
async function runCommand(input) {
  if (!input) return;

  await updateGhost('');
  const path = document.getElementById('segPath').textContent;
  addLine(`${path}  ${input}`, 'out-cmd');

  if (input.trim() === 'exit') { window.runtime.Quit(); return; }

  if (input.trim() === 'clear') {
    document.getElementById('output').innerHTML = '';
    updateStatus(true);
    return;
  }

  if (input.trim() === 'history') {
    history.forEach((cmd, i) => addLine(`  ${i + 1}  ${cmd}`, 'out-muted'));
    updateStatus(true);
    return;
  }

  if (input.trim() === 'alias') {
    const aliases = await window.go.main.App.GetAliases();
    if (!Object.keys(aliases).length) {
      addLine('  Aucun alias.', 'out-muted');
    } else {
      Object.entries(aliases).forEach(([k, v]) => addLine(`  ${k}  →  ${v}`, 'out-muted'));
    }
    updateStatus(true);
    return;
  }

  if (input.trim().startsWith('alias ')) {
    const raw = input.trim().slice(6);
    const eq  = raw.indexOf('=');
    if (eq !== -1) {
      const name = raw.slice(0, eq).trim();
      const cmd  = raw.slice(eq + 1).replace(/"/g, '').trim();
      const err  = await window.go.main.App.SaveAlias(name, cmd);
      if (err) { addLine('❌ ' + err, 'out-error'); updateStatus(false); }
      else     { addLine(`✅ alias ${name} → ${cmd}`, 'out-success'); updateStatus(true); }
    } else {
      addLine('❌ Syntaxe : alias nom="commande"', 'out-error');
      updateStatus(false);
    }
    return;
  }

  if (input.trim().startsWith('unalias ')) {
    const name = input.trim().slice(8).trim();
    await window.go.main.App.DeleteAlias(name);
    addLine(`✅ alias supprimé : ${name}`, 'out-success');
    updateStatus(true);
    return;
  }

  await window.go.main.App.SaveHistory(input);
  history = await window.go.main.App.GetHistory() || [];
  historyIndex = history.length;

  const result = await window.go.main.App.RunCommand(input);

  const hasError = !!result.error;
  if (result.error)      addLine('❌ ' + result.error, 'out-error');
  if (result.suggestion) addSuggestion(result.suggestion, input);
  if (result.output)     addLine(result.output, 'out-normal');

  updateStatus(!hasError);

  const newPath = await window.go.main.App.GetCurrentPath();
  document.getElementById('segPath').textContent = newPath;

  await refreshFiles();
  await updateGitBranch();
}

// ── Suggestion intelligente ───────────────────────────────────
function addSuggestion(suggestion, originalInput) {
  const output = document.getElementById('output');
  const div = document.createElement('div');
  div.className = 'out-suggestion';
  div.innerHTML = `
    💡 <span style="color:var(--text-mute)">Vouliez-vous dire</span>
    <span class="suggestion-word">${suggestion}</span>
    <button class="suggestion-btn" onclick="acceptSuggestion('${suggestion}','${originalInput}')">Exécuter</button>
    <button class="suggestion-btn dismiss" onclick="this.parentElement.remove()">Ignorer</button>
  `;
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
}

async function acceptSuggestion(suggestion, originalInput) {
  const parts = originalInput.trim().split(' ');
  parts[0] = suggestion;
  document.querySelector('.out-suggestion')?.remove();
  await runCommand(parts.join(' '));
}

// ── Gestion clavier ───────────────────────────────────────────
document.getElementById('commandInput').addEventListener('input', async (e) => {
  await updateGhost(e.target.value);
});

document.getElementById('commandInput').addEventListener('keydown', async (e) => {
  const input = document.getElementById('commandInput');

  if (e.ctrlKey && e.key === 'c') {
    const sel = window.getSelection().toString();
    if (sel) { e.preventDefault(); await navigator.clipboard.writeText(sel); return; }
    input.value = '';
    await updateGhost('');
    return;
  }

  if (e.ctrlKey && e.key === 'v') {
    e.preventDefault();
    const text = await navigator.clipboard.readText();
    const pos  = input.selectionStart;
    input.value = input.value.slice(0, pos) + text + input.value.slice(input.selectionEnd);
    input.selectionStart = input.selectionEnd = pos + text.length;
    await updateGhost(input.value);
    return;
  }

  if (e.ctrlKey && e.key === 'a') { e.preventDefault(); input.select(); return; }
  if (e.ctrlKey && e.key === 't') { e.preventDefault(); createTab(); return; }
  if (e.ctrlKey && e.key === 'w') {
    e.preventDefault();
    if (activeTab) closeTab(new Event('click'), activeTab.id);
    return;
  }

  if ((e.key === 'ArrowRight' || e.key === 'Tab') && ghostSuggestion) {
    if (input.selectionStart === input.value.length) {
      e.preventDefault();
      input.value = ghostSuggestion;
      await updateGhost('');
      return;
    }
  }

  if (e.key === 'Enter') {
    const cmd = input.value.trim();
    input.value = '';
    await updateGhost('');
    await runCommand(cmd);

  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      input.value = history[historyIndex];
      await updateGhost(input.value);
    }

  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex < history.length - 1) {
      historyIndex++;
      input.value = history[historyIndex];
      await updateGhost(input.value);
    } else {
      historyIndex = history.length;
      input.value = '';
      await updateGhost('');
    }
  }
});

document.addEventListener('click', () => {
  document.getElementById('commandInput').focus();
});

// ── Message de bienvenue ──────────────────────────────────────
async function showWelcome() {
  addLine('Leyo Shell  1.5', 'out-welcome');
  addLine('Ctrl+T nouvelle session  ·  Ctrl+W fermer  ·  Tab complétion  ·  Glisser-déposer', 'out-muted');
  addLine('', 'out-normal');

  const path = await window.go.main.App.GetCurrentPath();
  document.getElementById('segPath').textContent = path;
  document.getElementById('sidebarPath').textContent = path;
  await refreshFiles();
  await updateGitBranch();
  updateStatus(true);

  // Init drag & drop après que le DOM est prêt
  initDragDrop();
}

init().then(() => showWelcome());