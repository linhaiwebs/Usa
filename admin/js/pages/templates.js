async function renderTemplates() {
  const container = document.getElementById('page-container');

  try {
    const templates = await API.get('/api/templates');
    const activeResp = await API.get('/api/templates/active');
    const activeName = activeResp.active;

    let editorTemplate = '';
    let editorFile = '';
    let editorOriginal = '';
    let syncTemplate = '';

    container.innerHTML = `
      <div class="card">
        <div class="card-header"><span>Template List</span></div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Template</th>
                <th>Version</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${templates.map(t => `
                <tr${t.name === activeName ? ' class="row-active"' : ''}>
                  <td><strong>${escHtml(t.name)}</strong></td>
                  <td class="text-muted">${t.version || '—'}</td>
                  <td>${t.name === activeName
                    ? '<span class="badge badge-green">Active</span>'
                    : `<button class="btn btn-sm btn-primary" onclick="activateTemplate('${escAttr(t.name)}')">Set Active</button>`
                  }</td>
                  <td>
                    <div class="btn-group">
                      <button class="btn btn-sm" onclick="openEditor('${escAttr(t.name)}', 'template.html')">Edit HTML</button>
                      <button class="btn btn-sm" onclick="openEditor('${escAttr(t.name)}', 'style.css')">Edit CSS</button>
                      <button class="btn btn-sm" onclick="openEditor('${escAttr(t.name)}', 'config.json')">Edit Config</button>
                      <button class="btn btn-sm btn-success" onclick="openSyncModal('${escAttr(t.name)}')">Sync</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-overlay" id="editor-modal" style="display:none">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <span id="editor-title">Edit File</span>
            <div class="btn-group" style="margin:0 12px">
              <button class="btn btn-sm tab-item active" data-file="template.html" onclick="switchEditorTab('template.html', this)">HTML</button>
              <button class="btn btn-sm tab-item" data-file="style.css" onclick="switchEditorTab('style.css', this)">CSS</button>
              <button class="btn btn-sm tab-item" data-file="config.json" onclick="switchEditorTab('config.json', this)">Config</button>
            </div>
            <button class="btn btn-sm" onclick="closeEditor()" style="margin-left:auto">&times; Close</button>
          </div>
          <div class="code-status" id="editor-status">Ready</div>
          <textarea id="modal-code-editor" class="form-group code-editor" style="min-height:420px" onkeyup="markEditorUnsaved()"></textarea>
          <div class="btn-group" style="margin-top:10px">
            <button class="btn btn-primary" onclick="saveCurrentFile()">Save File (Ctrl+S)</button>
            <span id="editor-save-status" style="font-size:11px;color:var(--green);display:none">Saved &mdash; page will hot reload</span>
          </div>
        </div>
      </div>

      <div class="modal-overlay" id="sync-modal" style="display:none">
        <div class="modal-content">
          <div class="modal-header">
            <span id="sync-title">GitHub Sync</span>
            <button class="btn btn-sm" onclick="closeSyncModal()" style="margin-left:auto">&times; Close</button>
          </div>
          <div class="form-group">
            <label>GitHub Repository URL</label>
            <input id="sync-repo" placeholder="https://github.com/user/repo.git">
          </div>
          <button class="btn btn-success" id="sync-btn" onclick="doSync()">Sync from GitHub</button>
          <span id="sync-status" style="font-size:11px;margin-left:8px;display:none"></span>
        </div>
      </div>
    `;

    // Helper: escape HTML
    function escHtml(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    // Helper: escape attribute value for onclick etc.
    function escAttr(s) {
      return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }

    // Expose helpers on window so inline onclick can use them
    window._templates = templates;
    window._activeName = activeName;

    window.activateTemplate = async (name) => {
      try {
        await API.put('/api/templates/active', { name });
        showToast(`Switched to template: ${name}`, 'success');
        renderTemplates();
      } catch (e) { showToast(e.message, 'error'); }
    };

    window.openEditor = async (name, file) => {
      editorTemplate = name;
      editorFile = file;
      try {
        const files = await API.get(`/api/templates/${name}/files`);
        const content = files[file] || '';
        editorOriginal = content;
        const editor = document.getElementById('modal-code-editor');
        editor.value = content;
        document.getElementById('editor-title').textContent = `${name} / ${file}`;
        document.getElementById('editor-status').textContent = `${file} — ${content.length} chars`;
        document.getElementById('editor-save-status').style.display = 'none';
        // Highlight correct tab
        document.querySelectorAll('#editor-modal .tab-item').forEach(t => {
          t.classList.toggle('active', t.getAttribute('data-file') === file);
        });
        document.getElementById('editor-modal').style.display = 'flex';
        editor.focus();
      } catch (e) { showToast(e.message, 'error'); }
    };

    window.closeEditor = () => {
      document.getElementById('editor-modal').style.display = 'none';
    };

    window.switchEditorTab = async (file, el) => {
      if (editorFile === file) return;
      editorFile = file;
      document.querySelectorAll('#editor-modal .tab-item').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      try {
        const files = await API.get(`/api/templates/${editorTemplate}/files`);
        const content = files[file] || '';
        editorOriginal = content;
        const editor = document.getElementById('modal-code-editor');
        editor.value = content;
        document.getElementById('editor-title').textContent = `${editorTemplate} / ${file}`;
        document.getElementById('editor-status').textContent = `${file} — ${content.length} chars`;
        document.getElementById('editor-save-status').style.display = 'none';
      } catch (e) { showToast(e.message, 'error'); }
    };

    window.markEditorUnsaved = () => {
      const editor = document.getElementById('modal-code-editor');
      const changed = editor.value !== editorOriginal;
      document.getElementById('editor-status').textContent = changed
        ? `${editorFile} — UNSAVED CHANGES`
        : `${editorFile}`;
    };

    window.saveCurrentFile = async () => {
      const content = document.getElementById('modal-code-editor').value;
      try {
        await API.put(`/api/templates/${editorTemplate}/files`, { filename: editorFile, content });
        editorOriginal = content;
        document.getElementById('editor-status').textContent = `${editorFile} — saved`;
        const s = document.getElementById('editor-save-status');
        s.style.display = 'inline';
        setTimeout(() => { s.style.display = 'none'; }, 3000);
        showToast(`${editorFile} saved — hot reload triggered`, 'success');
      } catch (e) { showToast(e.message, 'error'); }
    };

    window.openSyncModal = async (name) => {
      syncTemplate = name;
      document.getElementById('sync-title').textContent = `GitHub Sync — ${name}`;
      // Pre-fill repo URL if configured
      const tmpl = templates.find(t => t.name === name);
      document.getElementById('sync-repo').value = (tmpl && tmpl.githubRepo) ? tmpl.githubRepo : '';
      document.getElementById('sync-status').style.display = 'none';
      document.getElementById('sync-modal').style.display = 'flex';
    };

    window.closeSyncModal = () => {
      document.getElementById('sync-modal').style.display = 'none';
    };

    window.doSync = async () => {
      const repo = document.getElementById('sync-repo').value.trim();
      if (!repo) return showToast('Enter a GitHub repo URL', 'error');
      const btn = document.getElementById('sync-btn');
      const status = document.getElementById('sync-status');
      btn.disabled = true;
      btn.textContent = 'Syncing...';
      status.style.display = 'none';
      try {
        // Save repo URL to template settings first
        await API.put(`/api/templates/${syncTemplate}/settings`, { githubRepo: repo });
        const result = await API.post(`/api/templates/${syncTemplate}/sync`, {});
        status.textContent = 'Sync completed';
        status.style.color = 'var(--green)';
        status.style.display = 'inline';
        showToast('GitHub sync completed', 'success');
        // Refresh the template list to show updated lastSync
        setTimeout(() => renderTemplates(), 500);
      } catch (e) {
        status.textContent = 'Sync failed: ' + e.message;
        status.style.color = 'var(--red)';
        status.style.display = 'inline';
        showToast('Sync failed: ' + e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sync from GitHub';
      }
    };

    // Ctrl+S shortcut for editor modal
    document.addEventListener('keydown', function editorSaveShortcut(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const modal = document.getElementById('editor-modal');
        if (modal && modal.style.display !== 'none') {
          e.preventDefault();
          if (window.saveCurrentFile) window.saveCurrentFile();
        }
      }
    });

    // Close modals on overlay click
    document.getElementById('editor-modal').addEventListener('click', function (e) {
      if (e.target === this) closeEditor();
    });
    document.getElementById('sync-modal').addEventListener('click', function (e) {
      if (e.target === this) closeSyncModal();
    });

  } catch (e) {
    container.innerHTML = `<div class="card"><div class="empty-state"><p>Error: ${e.message}</p></div></div>`;
  }
}
