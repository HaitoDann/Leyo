// ── État global ───────────────────────────────────────────────
let history = [];
let historyIndex = 0;
let ghostSuggestion = '';

// ── Système d'onglets ─────────────────────────────────────────
let tabs = [];
let activeTab = null;
let tabCounter = 0;

function createTab() {
  const id = ++tabCounter;
  const tab = {
    id,
    label: `Shell ${id}`,
    output: '',
    path: 'C:\\'
  };
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
      ${tabs.length > 1
        ? `<span class="tab-close" onclick="closeTab(event, ${t.id})">✕</span>`
        : ''}
    `;
    container.appendChild(div);
  });
}

async function switchTab(id) {
  if (activeTab) {
    activeTab.output = document.getElementById('output').innerHTML;
    activeTab.path = document.getElementById('currentPath').textContent;
  }

  activeTab = tabs.find(t => t.id === id);
  if (!activeTab) return;

  document.getElementById('output').innerHTML = activeTab.output;
  document.getElementById('currentPath').textContent = activeTab.path;
  document.getElementById('commandInput').value = '';
  updateGhost('');
  renderTabs();

  // Synchronise le chemin côté Go
  await window.go.main.App.RunCommand(`cd "${activeTab.path}"`);
  await refreshFiles();
}

function closeTab(e, id) {
  e.stopPropagation();
  if (tabs.length <= 1) return;
  tabs = tabs.filter(t => t.id !== id);
  if (activeTab?.id === id) {
    switchTab(tabs[tabs.length - 1].id);
  } else {
    renderTabs();
  }
}

document.getElementById('tabAdd').addEventListener('click', () => {
  createTab();
});

// ── Ghost text ────────────────────────────────────────────────
const knownCommands = [
  'ls', 'rm', 'cp', 'mv', 'cat', 'clear', 'pwd', 'mkdir', 'touch', 'cd',
  'dir', 'del', 'copy', 'move', 'type', 'cls', 'echo', 'find', 'help',
  'git', 'git add', 'git commit', 'git push', 'git pull', 'git status',
  'git clone', 'git checkout', 'git branch', 'git log', 'git diff',
  'go build', 'go run', 'go mod', 'go test', 'go get',
  'history', 'exit', 'alias', 'unalias'
];

function findGhostSuggestion(input) {
  if (!input) return '';
  const lower = input.toLowerCase();
  const candidates = [...knownCommands, ...history];
  for (const cmd of candidates) {
    const c = cmd.toLowerCase();
    if (c.startsWith(lower) && c !== lower) return cmd;
  }
  return '';
}

function updateGhost(input) {
  const ghost = document.getElementById('ghostText');
  ghostSuggestion = findGhostSuggestion(input);
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
  ctx.font = '13px Cascadia Code, Consolas, Courier New, monospace';
  return ctx.measureText(text).width;
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
  history = await window.go.main.App.GetHistory() || [];
  historyIndex = history.length;

  createTab(); // Premier onglet

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
async function refreshFiles() {
  const files = await window.go.main.App.ListFiles() || [];
  const list = document.getElementById('fileList');
  list.innerHTML = '';

  files.forEach(f => {
    const item = document.createElement('div');
    item.className = 'file-item';
    const icon = document.createElement('span');
    const name = document.createElement('span');
    name.textContent = f.Name;

    if (f.IsDir) {
      icon.textContent = '▶';
      name.className = 'file-dir';
      item.title = 'Double-clic pour naviguer';
      item.ondblclick = () => {
        document.getElementById('commandInput').value = `cd ${f.Name}`;
        updateGhost(`cd ${f.Name}`);
        document.getElementById('commandInput').focus();
      };
    } else {
      switch ((f.Ext || '').toLowerCase()) {
        case '.go':   icon.textContent = '◆'; name.className = 'file-go';   break;
        case '.exe':  icon.textContent = '⚙'; name.className = 'file-exe';  break;
        case '.md':   icon.textContent = '■'; name.className = 'file-md';   break;
        case '.yml':
        case '.yaml': icon.textContent = '◈'; name.className = 'file-yml';  break;
        case '.json': icon.textContent = '◈'; name.className = 'file-json'; break;
        default:      icon.textContent = '·'; name.className = 'file-other';
      }
    }

    item.appendChild(icon);
    item.appendChild(name);
    list.appendChild(item);
  });
}

// ── Exécution commande ────────────────────────────────────────
async function runCommand(input) {
  if (!input) return;

  updateGhost('');

  const path = document.getElementById('currentPath').textContent;
  addLine(`[VinX] ${path} > ${input}`, 'out-cmd');

  // Commandes internes
  if (input.trim() === 'exit') {
    window.runtime.Quit();
    return;
  }

  if (input.trim() === 'clear') {
    document.getElementById('output').innerHTML = '';
    return;
  }

  if (input.trim() === 'history') {
    history.forEach((cmd, i) => addLine(`  ${i + 1}  ${cmd}`, 'out-muted'));
    return;
  }

  // Alias — affiche la liste
  if (input.trim() === 'alias') {
    const aliases = await window.go.main.App.GetAliases();
    if (Object.keys(aliases).length === 0) {
      addLine('  Aucun alias défini.', 'out-muted');
    } else {
      Object.entries(aliases).forEach(([k, v]) => {
        addLine(`  ${k}  →  ${v}`, 'out-muted');
      });
    }
    return;
  }

  // Alias — crée un alias  →  alias ll="ls -la"
  if (input.trim().startsWith('alias ')) {
    const raw = input.trim().slice(6);
    const eqIdx = raw.indexOf('=');
    if (eqIdx !== -1) {
      const name = raw.slice(0, eqIdx).trim();
      const cmd  = raw.slice(eqIdx + 1).replace(/"/g, '').trim();
      const err  = await window.go.main.App.SaveAlias(name, cmd);
      if (err) {
        addLine('❌ ' + err, 'out-error');
      } else {
        addLine(`✅ Alias créé : ${name} → ${cmd}`, 'out-success');
      }
    } else {
      addLine('❌ Syntaxe : alias nom="commande"', 'out-error');
    }
    return;
  }

  // Unalias
  if (input.trim().startsWith('unalias ')) {
    const name = input.trim().slice(8).trim();
    await window.go.main.App.DeleteAlias(name);
    addLine(`✅ Alias supprimé : ${name}`, 'out-success');
    return;
  }

  // Sauvegarde historique
  await window.go.main.App.SaveHistory(input);
  history = await window.go.main.App.GetHistory() || [];
  historyIndex = history.length;

  // Exécution
  const result = await window.go.main.App.RunCommand(input);

  if (result.error)      addLine('❌ ' + result.error, 'out-error');
  if (result.suggestion) addSuggestion(result.suggestion, input);
  if (result.output)     addLine(result.output, 'out-normal');

  const newPath = await window.go.main.App.GetCurrentPath();
  document.getElementById('currentPath').textContent = newPath;

  await refreshFiles();
}

// ── Suggestion intelligente ───────────────────────────────────
function addSuggestion(suggestion, originalInput) {
  const output = document.getElementById('output');
  const div = document.createElement('div');
  div.className = 'out-suggestion';
  div.innerHTML = `
    💡 Vouliez-vous dire :
    <span class="suggestion-word">${suggestion}</span>
    <button class="suggestion-btn" onclick="acceptSuggestion('${suggestion}', '${originalInput}')">Exécuter</button>
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
document.getElementById('commandInput').addEventListener('input', (e) => {
  updateGhost(e.target.value);
});

document.getElementById('commandInput').addEventListener('keydown', async (e) => {
  const input = document.getElementById('commandInput');

  // Ctrl+C → copier sélection
  if (e.ctrlKey && e.key === 'c') {
    const selection = window.getSelection().toString();
    if (selection) {
      e.preventDefault();
      await navigator.clipboard.writeText(selection);
      return;
    }
    input.value = '';
    updateGhost('');
    return;
  }

  // Ctrl+V → coller dans le prompt
  if (e.ctrlKey && e.key === 'v') {
    e.preventDefault();
    const text = await navigator.clipboard.readText();
    const pos = input.selectionStart;
    input.value = input.value.slice(0, pos) + text + input.value.slice(input.selectionEnd);
    input.selectionStart = input.selectionEnd = pos + text.length;
    updateGhost(input.value);
    return;
  }

  // Ctrl+A → sélectionner tout
  if (e.ctrlKey && e.key === 'a') {
    e.preventDefault();
    input.select();
    return;
  }

  // Ctrl+T → nouvel onglet
  if (e.ctrlKey && e.key === 't') {
    e.preventDefault();
    createTab();
    return;
  }

  // Ctrl+W → fermer onglet
  if (e.ctrlKey && e.key === 'w') {
    e.preventDefault();
    if (activeTab) closeTab(new Event('click'), activeTab.id);
    return;
  }

  // → ou Tab → accepte ghost text
  if ((e.key === 'ArrowRight' || e.key === 'Tab') && ghostSuggestion) {
    if (input.selectionStart === input.value.length) {
      e.preventDefault();
      input.value = ghostSuggestion;
      updateGhost('');
      return;
    }
  }

  if (e.key === 'Enter') {
    const cmd = input.value.trim();
    input.value = '';
    updateGhost('');
    await runCommand(cmd);

  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      input.value = history[historyIndex];
      updateGhost(input.value);
    }

  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex < history.length - 1) {
      historyIndex++;
      input.value = history[historyIndex];
      updateGhost(input.value);
    } else {
      historyIndex = history.length;
      input.value = '';
      updateGhost('');
    }
  }
});

document.addEventListener('click', () => {
  document.getElementById('commandInput').focus();
});

// ── Message de bienvenue dans le premier onglet ───────────────
async function showWelcome() {
  addLine('╔════════════════════════════════════╗', 'out-welcome');
  addLine('║       LEYO SHELL  v2.0             ║', 'out-welcome');
  addLine('║  Bienvenue VinX !                  ║', 'out-welcome');
  addLine('║  Ctrl+T : nouvel onglet            ║', 'out-welcome');
  addLine('║  Ctrl+W : fermer onglet            ║', 'out-welcome');
  addLine('╚════════════════════════════════════╝', 'out-welcome');
  addLine('');

  const path = await window.go.main.App.GetCurrentPath();
  document.getElementById('currentPath').textContent = path;
  await refreshFiles();
}

init().then(() => showWelcome());