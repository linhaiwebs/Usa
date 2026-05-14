async function renderTemplates() {
  const container = document.getElementById('page-container');

  try {
    const templates = await API.get('/api/templates');
    const activeResp = await API.get('/api/templates/active');
    const activeName = activeResp.active;

    let editorTemplate = '';
    let editorFile = '';
    let editorOriginal = '';

    const settingsRepo = templates.length > 0 ? (templates[0].githubRepo || '') : '';

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span>模板列表</span>
          <div class="btn-group" style="align-items:center">
            <input id="global-github-repo" placeholder="GitHub 仓库地址" value="${escHtml(settingsRepo)}" style="padding:4px 8px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font-size:11px;width:260px">
            <button class="btn btn-sm btn-success" onclick="syncAllTemplates()">从 GitHub 同步</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>模板</th>
                <th>版本</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${templates.map(t => `
                <tr${t.name === activeName ? ' class="row-active"' : ''}>
                  <td><strong>${escHtml(t.name)}</strong></td>
                  <td class="text-muted">${t.version || '—'}</td>
                  <td>${t.name === activeName
                    ? '<span class="badge badge-green">当前</span>'
                    : `<button class="btn btn-sm btn-primary" onclick="activateTemplate('${escAttr(t.name)}')">设为当前</button>`
                  }</td>
                  <td>
                    <div class="btn-group">
                      <button class="btn btn-sm" onclick="openEditor('${escAttr(t.name)}', 'template.html')">编辑 HTML</button>
                      <button class="btn btn-sm" onclick="openEditor('${escAttr(t.name)}', 'style.css')">编辑 CSS</button>
                      <button class="btn btn-sm" onclick="openEditor('${escAttr(t.name)}', 'config.json')">编辑配置</button>
                      <button class="btn btn-sm" onclick="openPopupEditor('${escAttr(t.name)}')">弹窗</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 文件编辑器弹窗 -->
      <div class="modal-overlay" id="editor-modal" style="display:none">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <span id="editor-title">编辑文件</span>
            <div class="btn-group" style="margin:0 12px">
              <button class="btn btn-sm tab-item active" data-file="template.html" onclick="switchEditorTab('template.html', this)">HTML</button>
              <button class="btn btn-sm tab-item" data-file="style.css" onclick="switchEditorTab('style.css', this)">CSS</button>
              <button class="btn btn-sm tab-item" data-file="config.json" onclick="switchEditorTab('config.json', this)">配置</button>
            </div>
            <button class="btn btn-sm" onclick="closeEditor()" style="margin-left:auto">&times; 关闭</button>
          </div>
          <div class="code-status" id="editor-status">就绪</div>
          <textarea id="modal-code-editor" class="form-group code-editor" style="min-height:420px" onkeyup="markEditorUnsaved()"></textarea>
          <div class="btn-group" style="margin-top:10px">
            <button class="btn btn-primary" onclick="saveCurrentFile()">保存文件 (Ctrl+S)</button>
            <span id="editor-save-status" style="font-size:11px;color:var(--green);display:none">已保存 — 页面将热重载</span>
          </div>
        </div>
      </div>

      <!-- 弹窗编辑器弹窗 -->
      <div class="modal-overlay" id="popup-editor-modal" style="display:none">
        <div class="modal-content" style="min-width:600px;max-width:800px">
          <div class="modal-header">
            <span id="popup-editor-title">编辑弹窗</span>
            <button class="btn btn-sm" onclick="closePopupEditor()" style="margin-left:auto">&times; 关闭</button>
          </div>
          <div class="form-check">
            <input type="checkbox" id="popup-enabled">
            <label for="popup-enabled" style="margin:0;cursor:pointer">启用弹窗</label>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>触发类型</label>
              <select id="popup-type">
                <option value="modal">定时弹窗</option>
                <option value="exit-intent">退出意图</option>
              </select>
            </div>
            <div class="form-group">
              <label>延迟 (毫秒)</label>
              <input id="popup-delay" type="number" value="5000" placeholder="5000">
            </div>
          </div>
          <div class="form-group">
            <label>标题</label>
            <input id="popup-title" placeholder="弹窗标题">
          </div>
          <div class="form-group">
            <label>内容 HTML <span style="font-weight:400;text-transform:none;color:var(--text-secondary)">— 使用 <code style="background:var(--bg);padding:1px 4px;border-radius:2px">{{split_url}}</code> 作为动态分流链接，或在链接/按钮上使用 <code style="background:var(--bg);padding:1px 4px;border-radius:2px">data-cta="split"</code></span></label>
            <textarea id="popup-content" style="min-height:160px;font-family:var(--mono);font-size:12px" placeholder="<p>您的优惠内容...</p><a href=&quot;#&quot; data-cta=&quot;split&quot;>立即获取</a>"></textarea>
          </div>
          <div class="form-check">
            <input type="checkbox" id="popup-once">
            <label for="popup-once" style="margin:0;cursor:pointer">每次会话仅显示一次</label>
          </div>
          <div class="btn-group" style="margin-top:12px">
            <button class="btn btn-primary" onclick="savePopup()">保存弹窗</button>
            <span id="popup-save-status" style="font-size:11px;color:var(--green);display:none">已保存 — 已生效</span>
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

    // ---- 模板激活 ----
    window.activateTemplate = async (name) => {
      try {
        await API.put('/api/templates/active', { name });
        showToast(`已切换到模板: ${name}`, 'success');
        renderTemplates();
      } catch (e) { showToast(e.message, 'error'); }
    };

    // ---- 文件编辑器 ----
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
        document.getElementById('editor-status').textContent = `${file} — ${content.length} 字符`;
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
        document.getElementById('editor-status').textContent = `${file} — ${content.length} 字符`;
        document.getElementById('editor-save-status').style.display = 'none';
      } catch (e) { showToast(e.message, 'error'); }
    };

    window.markEditorUnsaved = () => {
      const editor = document.getElementById('modal-code-editor');
      const changed = editor.value !== editorOriginal;
      document.getElementById('editor-status').textContent = changed
        ? `${editorFile} — 未保存的更改`
        : `${editorFile}`;
    };

    window.saveCurrentFile = async () => {
      const content = document.getElementById('modal-code-editor').value;
      try {
        await API.put(`/api/templates/${editorTemplate}/files`, { filename: editorFile, content });
        editorOriginal = content;
        document.getElementById('editor-status').textContent = `${editorFile} — 已保存`;
        const s = document.getElementById('editor-save-status');
        s.style.display = 'inline';
        setTimeout(() => { s.style.display = 'none'; }, 3000);
        showToast(`${editorFile} 已保存 — 热重载已触发`, 'success');
      } catch (e) { showToast(e.message, 'error'); }
    };

    // ---- 弹窗编辑器 ----
    window.openPopupEditor = async (name) => {
      popupTemplate = name;
      try {
        const popup = await API.get(`/api/templates/${name}/popup`);
        document.getElementById('popup-editor-title').textContent = `编辑弹窗 — ${name}`;
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
        showToast('弹窗已保存 — 已生效', 'success');
      } catch (e) { showToast(e.message, 'error'); }
    };

    // ---- GitHub 同步 ----
    window.syncAllTemplates = async () => {
      const repo = document.getElementById('global-github-repo').value.trim();
      if (!repo) return showToast('请输入 GitHub 仓库地址', 'error');

      const name = activeName || (templates[0] && templates[0].name);
      if (!name) return showToast('无可用模板', 'error');

      const btn = document.activeElement;
      btn.disabled = true;
      btn.textContent = '同步中...';
      try {
        const result = await API.post(`/api/templates/${name}/sync`, { repoUrl: repo });
        showToast(`同步完成: ${result.synced.length} 个模板已更新`, 'success');
        setTimeout(() => renderTemplates(), 500);
      } catch (e) {
        showToast('同步失败: ' + e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '从 GitHub 同步';
      }
    };

    // Ctrl+S 快捷键
    document.addEventListener('keydown', function editorSaveShortcut(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const modal = document.getElementById('editor-modal');
        if (modal && modal.style.display !== 'none') {
          e.preventDefault();
          if (window.saveCurrentFile) window.saveCurrentFile();
        }
      }
    });

    // 点击遮罩关闭弹窗
    document.getElementById('editor-modal').addEventListener('click', function (e) {
      if (e.target === this) closeEditor();
    });
    document.getElementById('popup-editor-modal').addEventListener('click', function (e) {
      if (e.target === this) closePopupEditor();
    });

  } catch (e) {
    container.innerHTML = `<div class="card"><div class="empty-state"><p>加载失败: ${e.message}</p></div></div>`;
  }
}
