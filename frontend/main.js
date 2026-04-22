let history = [];
let historyIndex = 0;
let ghostSuggestion = '';

const knownCommands = [
  'ls', 'rm', 'cp', 'mv', 'cat', 'clear', 'pwd', 'mkdir', 'touch', 'cd',
  'dir', 'del', 'copy', 'move', 'type', 'cls', 'echo', 'find', 'help',
  'git', 'git add', 'git commit', 'git push', 'git pull', 'git status',
  'git clone', 'git checkout', 'git branch', 'git log', 'git diff',
  'go build', 'go run', 'go mod', 'go test', 'go get',
  'history', 'exit'
];

function findGhostSuggestion(input, history) {
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
  const allCandidates = [...knownCommands, ...history];
  ghostSuggestion = findGhostSuggestion(input, allCandidates);
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

async function init() {
  history = await window.go.main.App.GetHistory() || [];
  historyIndex = history.length;

  const path = await window.go.main.App.GetCurrentPath();
  document.getElementById('currentPath').textContent = path;

  await refreshFiles();

  addLine('╔═══════════════════════════════╗', 'out-welcome');
  addLine('║      LEYO SHELL  v1.0         ║', 'out-welcome');
  addLine('║  Bienvenue VinX !             ║', 'out-welcome');
  addLine('╚═══════════════════════════════╝', 'out-welcome');
  addLine('');

  document.getElementById('commandInput').focus();
}

function addLine(text, cls = 'out-normal') {
  const output = document.getElementById('output');
  const div = document.createElement('div');
  div.className = cls;
  div.textContent = text;
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
}

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

async function runCommand(input) {
  if (!input) return;

  updateGhost('');

  const path = document.getElementById('currentPath').textContent;
  addLine(`[VinX] ${path} > ${input}`, 'out-cmd');

  if (input.trim() === 'exit') {
    window.runtime.Quit();
    return;
  }

  if (input.trim() === 'history') {
    history.forEach((cmd, i) => addLine(`  ${i + 1}  ${cmd}`, 'out-muted'));
    return;
  }

  if (input.trim() === 'clear') {
    document.getElementById('output').innerHTML = '';
    return;
  }

  await window.go.main.App.SaveHistory(input);
  history = await window.go.main.App.GetHistory() || [];
  historyIndex = history.length;

  const result = await window.go.main.App.RunCommand(input);

  if (result.error)      addLine('❌ ' + result.error, 'out-error');
  if (result.suggestion) addSuggestion(result.suggestion, input);
  if (result.output)     addLine(result.output, 'out-normal');

  const newPath = await window.go.main.App.GetCurrentPath();
  document.getElementById('currentPath').textContent = newPath;

  await refreshFiles();
}

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
  const corrected = parts.join(' ');
  document.querySelector('.out-suggestion')?.remove();
  await runCommand(corrected);
}

// ── Gestion clavier ───────────────────────────────────────────
document.getElementById('commandInput').addEventListener('input', (e) => {
  updateGhost(e.target.value);
});

document.getElementById('commandInput').addEventListener('keydown', async (e) => {
  const input = document.getElementById('commandInput');

  // ── Ctrl+C → copie le texte sélectionné dans l'output ───────
  if (e.ctrlKey && e.key === 'c') {
    const selection = window.getSelection().toString();
    if (selection) {
      e.preventDefault();
      await navigator.clipboard.writeText(selection);
      return;
    }
    // Pas de sélection → comportement normal (annule la saisie)
    input.value = '';
    updateGhost('');
    return;
  }

  // ── Ctrl+V → colle dans le prompt ───────────────────────────
  if (e.ctrlKey && e.key === 'v') {
    e.preventDefault();
    const text = await navigator.clipboard.readText();
    const pos = input.selectionStart;
    const before = input.value.slice(0, pos);
    const after = input.value.slice(input.selectionEnd);
    input.value = before + text + after;
    input.selectionStart = input.selectionEnd = pos + text.length;
    updateGhost(input.value);
    return;
  }

  // ── Ctrl+A → sélectionne tout le prompt ─────────────────────
  if (e.ctrlKey && e.key === 'a') {
    e.preventDefault();
    input.select();
    return;
  }

  // ── → ou Tab : accepte le ghost text ────────────────────────
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

init();