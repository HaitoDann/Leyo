let history = [];
let historyIndex = 0;

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

  if (result.error) addLine('❌ ' + result.error, 'out-error');
  if (result.output) addLine(result.output, 'out-normal');

  const newPath = await window.go.main.App.GetCurrentPath();
  document.getElementById('currentPath').textContent = newPath;

  await refreshFiles();
}

document.getElementById('commandInput').addEventListener('keydown', async (e) => {
  const input = document.getElementById('commandInput');

  if (e.key === 'Enter') {
    const cmd = input.value.trim();
    input.value = '';
    await runCommand(cmd);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      input.value = history[historyIndex];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex < history.length - 1) {
      historyIndex++;
      input.value = history[historyIndex];
    } else {
      historyIndex = history.length;
      input.value = '';
    }
  }
});

document.addEventListener('click', () => {
  document.getElementById('commandInput').focus();
});

init();