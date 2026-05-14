async function renderTemplates() {
  const container = document.getElementById('page-container');

  try {
    const templates = await API.get('/api/templates');
    const activeResp = await API.get('/api/templates/active');
    const activeName = activeResp.active;

    let editorTemplate = '';
    let editorFile = '';
    let editorOriginal = '';

    // Get global github repo from first template's settings (stored in settings.json templates array)
    const settingsRepo = templates.length > 0 ? (templates[0].githubRepo || '') : '';

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span>Template List</span>
          <div class="btn-group" style="align-items:center">
            <input id="global-github-repo" placeholder="GitHub repo URL" value="${escHtml(settingsRepo)}" style="padding:4px 8px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font-size:11px;width:260px">
            <button class="btn btn-sm btn-success" onclick="syncAllTemplates()">Sync from GitHub</button>
          </div>
        </div>
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
                      <button class="btn btn-sm" onclick="openPopupEditor('${escAttr(t.name)}')">Popup</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- File Editor Modal -->
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

      <!-- Popup Editor Modal -->
      <div class="modal-overlay" id="popup-editor-modal" style="display:none">
        <div class="modal-content" style="min-width:600px;max-width:800px">
          <div class="modal-header">
            <span id="popup-editor-title">Edit Popup</span>
            <button class="btn btn-sm" onclick="closePopupEditor()" style="margin-left:auto">&times; Close</button>
          </div>
          <div class="form-check">
            <input type="checkbox" id="popup-enabled">
            <label for="popup-enabled" style="margin:0;cursor:pointer">Enable Popup</label>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Trigger Type</label>
              <select id="popup-type">
                <option value="modal">Modal (timed)</option>
                <option value="exit-intent">Exit Intent</option>
              </select>
            </div>
            <div class="form-group">
              <label>Delay (ms)</label>
              <input id="popup-delay" type="number" value="5000" placeholder="5000">
            </div>
          </div>
          <div class="form-group">
            <label>Title</label>
            <input id="popup-title" placeholder="Popup title">
          </div>
          <div class="form-group">
            <label>Content HTML <span style="font-weight:400;text-transform:none;color:var(--text-secondary)">— use <code style="background:var(--bg);padding:1px 4px;border-radius:2px">{{split_url}}</code> for dynamic split link, or <code style="background:var(--bg);padding:1px 4px;border-radius:2px">data-cta="split"</code> on links/buttons</span></label>
            <textarea id="popup-content" style="min-height:160px;font-family:var(--mono);font-size:12px" placeholder="<p>Your offer...</p><a href=&quot;#&quot; data-cta=&quot;split&quot;>Get Now</a>"></textarea>
          </div>
          <div class="form-check">
            <input type="checkbox" id="popup-once">
            <label for="popup-once" style="margin:0;cursor:pointer">Show only once per session</label>
          </div>
          <div class="btn-group" style="margin-top:12px">
            <button class="btn btn-primary" onclick="savePopup()">Save Popup</button>
            <span id="popup-save-status" style="font-size:11px;color:var(--green);display:none">Saved &mdash; live</span>
          </div>
        </div>
      </div>
    `;

    function escHtml(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function escAttr(s) {
      return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }

    let popupTemplate = '';

    // ---- Template activation ----
    window.activateTemplate = async (name) => {
      try {
        await API.put('/api/templates/active', { name });
        showToast(`Switched to template: ${name}`, 'success');
        renderTemplates();
      } catch (e) { showToast(e.message, 'error'); }
    };

    // ---- File Editor ----
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

    // ---- Popup Editor ----
    window.openPopupEditor = async (name) => {
      popupTemplate = name;
      try {
        const popup = await API.get(`/api/templates/${name}/popup`);
        document.getElementById('popup-editor-title').textContent = `Edit Popup — ${name}`;
        document.getElementById('popup-enabled').checked = popup.enabled;
        document.getElementById('popup-type').value = popup.type || 'modal';
        document.getElementById('popup-delay').value = popup.delay || 5000;
        document.getElementById('popup-title').value = popup.title || '';
        document.getElementById('popup-content').value = popup.content || '';
        document.getElementById('popup-once').checked = popup.showOnce !== false;
        document.getElementById('popup-save-status').style.display = 'none';
        document.getElementById('popup-editor-modal').style.display = 'flex';
      } catch (e) { showToast(e.message, 'error'); }
    };

    window.closePopupEditor = () => {
      document.getElementById('popup-editor-modal').style.display = 'none';
    };

    window.savePopup = async () => {
      const data = {
        enabled: document.getElementById('popup-enabled').checked,
        type: document.getElementById('popup-type').value,
        title: document.getElementById('popup-title').value.trim(),
        content: document.getElementById('popup-content').value,
        delay: parseInt(document.getElementById('popup-delay').value) || 5000,
        showOnce: document.getElementById('popup-once').checked
      };
      try {
        await API.put(`/api/templates/${popupTemplate}/popup`, data);
        const s = document.getElementById('popup-save-status');
        s.style.display = 'inline';
        setTimeout(() => { s.style.display = 'none'; }, 2500);
        showToast('Popup saved — live on site', 'success');
      } catch (e) { showToast(e.message, 'error'); }
    };

    // ---- GitHub Sync (global) ----
    window.syncAllTemplates = async () => {
      const repo = document.getElementById('global-github-repo').value.trim();
      if (!repo) return showToast('Enter a GitHub repo URL', 'error');

      // Use the active template to trigger sync with the repo URL
      const name = activeName || (templates[0] && templates[0].name);
      if (!name) return showToast('No template available', 'error');

      const btn = document.activeElement;
      btn.disabled = true;
      btn.textContent = 'Syncing...';
      try {
        const result = await API.post(`/api/templates/${name}/sync`, { repoUrl: repo });
        showToast(`Sync complete: ${result.synced.length} templates updated`, 'success');
        // Refresh the page to show any new templates
        setTimeout(() => renderTemplates(), 500);
      } catch (e) {
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
    document.getElementById('popup-editor-modal').addEventListener('click', function (e) {
      if (e.target === this) closePopupEditor();
    });

  } catch (e) {
    container.innerHTML = `<div class="card"><div class="empty-state"><p>Error: ${e.message}</p></div></div>`;
  }
}
