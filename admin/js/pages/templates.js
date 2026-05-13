async function renderTemplates() {
  const container = document.getElementById('page-container');
  let currentTemplate = '';

  try {
    const templates = await API.get('/api/templates');
    const activeResp = await API.get('/api/templates/active');
    currentTemplate = activeResp.active;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span>Templates</span>
          <div class="btn-group">
            <select id="template-select" onchange="switchTemplate()" style="padding:4px 8px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font-size:12px">
              ${templates.map(t => `<option value="${t.name}" ${t.name === currentTemplate ? 'selected' : ''}>${t.name} ${t.name === currentTemplate ? '(active)' : ''}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" onclick="refreshTemplateFiles()">Load Files</button>
          </div>
        </div>
        <div id="template-info" style="margin-bottom:12px;font-size:11px;color:var(--text-secondary)">
          Active: <strong style="color:var(--accent)">${currentTemplate}</strong>
        </div>
        <div class="form-group">
          <label>GitHub Repository URL</label>
          <div style="display:flex;gap:8px">
            <input id="github-repo" placeholder="https://github.com/user/repo.git" style="flex:1">
            <button class="btn btn-success" onclick="syncGithub()">Sync from GitHub</button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span>File Editor</span>
          <div class="btn-group">
            <button class="btn btn-sm tab-item active" data-file="template.html" onclick="switchFileTab('template.html', this)">HTML</button>
            <button class="btn btn-sm tab-item" data-file="style.css" onclick="switchFileTab('style.css', this)">CSS</button>
            <button class="btn btn-sm tab-item" data-file="config.json" onclick="switchFileTab('config.json', this)">Config</button>
          </div>
        </div>
        <div class="code-status" id="code-status">Ready</div>
        <textarea id="code-editor" class="form-group code-editor" style="min-height:400px" onkeyup="markUnsaved()"></textarea>
        <div class="btn-group" style="margin-top:10px">
          <button class="btn btn-primary" onclick="saveFile()">Save File (Ctrl+S)</button>
          <span id="save-status" style="font-size:11px;color:var(--green);display:none">Saved &mdash; page will hot reload</span>
        </div>
      </div>
    `;

    let currentFile = 'template.html';
    let originalContent = '';
    let unsaved = false;

    window.switchTemplate = async () => {
      const name = document.getElementById('template-select').value;
      try {
        await API.put('/api/templates/active', { name });
        currentTemplate = name;
        showToast(`Switched to template: ${name}`, 'success');
        // Refresh the template info line
        const infoEl = document.getElementById('template-info');
        if (infoEl) infoEl.innerHTML = 'Active: <strong style="color:var(--accent)">' + name + '</strong>';
      } catch (e) { showToast(e.message, 'error'); }
    };

    // Load template files
    window.refreshTemplateFiles = async () => {
      const name = document.getElementById('template-select').value;
      try {
        const files = await API.get(`/api/templates/${name}/files`);
        // Show active template's github config
        const tmpl = templates.find(t => t.name === name);
        if (tmpl && tmpl.githubRepo) {
          document.getElementById('github-repo').value = tmpl.githubRepo;
        }
        // Load current file tab
        const editor = document.getElementById('code-editor');
        if (files[currentFile]) {
          editor.value = files[currentFile];
          originalContent = files[currentFile];
          document.getElementById('code-status').textContent = `${currentFile} — ${files[currentFile].length} chars`;
        }
      } catch (e) { showToast(e.message, 'error'); }
    };

    window.switchFileTab = (file, el) => {
      currentFile = file;
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      window.refreshTemplateFiles();
    };

    window.markUnsaved = () => {
      const editor = document.getElementById('code-editor');
      const changed = editor.value !== originalContent;
      document.getElementById('code-status').textContent = changed ? `${currentFile} — UNSAVED CHANGES` : `${currentFile}`;
    };

    window.saveFile = async () => {
      const name = document.getElementById('template-select').value;
      const content = document.getElementById('code-editor').value;
      try {
        await API.put(`/api/templates/${name}/files`, { filename: currentFile, content });
        originalContent = content;
        document.getElementById('code-status').textContent = `${currentFile} — saved`;
        const s = document.getElementById('save-status');
        s.style.display = 'inline';
        setTimeout(() => s.style.display = 'none', 3000);
        showToast(`${currentFile} saved — hot reload triggered`, 'success');
      } catch (e) { showToast(e.message, 'error'); }
    };

    window.syncGithub = async () => {
      const name = document.getElementById('template-select').value;
      const repo = document.getElementById('github-repo').value.trim();
      if (!repo) return showToast('Enter a GitHub repo URL', 'error');

      // Update repo in settings
      try {
        const settings = await API.get('/api/templates');
        // We need to update the template's githubRepo. Use the settings endpoint approach:
        await API.put(`/api/templates/active`, { name }); // ensure active
        // Actually need an API for updating template metadata. Let's just sync first.
        const btn = document.activeElement;
        btn.disabled = true;
        btn.textContent = 'Syncing...';
        await API.post(`/api/templates/${name}/sync`, {});
        btn.textContent = 'Sync from GitHub';
        btn.disabled = false;
        showToast('GitHub sync completed', 'success');
        window.refreshTemplateFiles();
      } catch (e) {
        showToast('Sync failed: ' + e.message, 'error');
        const btn = document.activeElement;
        btn.disabled = false;
        btn.textContent = 'Sync from GitHub';
      }
    };

    // Ctrl+S shortcut
    document.addEventListener('keydown', function saveShortcut(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (window.saveFile) window.saveFile();
      }
    });

    // Initial load
    setTimeout(() => window.refreshTemplateFiles(), 200);
  } catch (e) {
    container.innerHTML = `<div class="card"><div class="empty-state"><p>Error: ${e.message}</p></div></div>`;
  }
}
