let cmInstance = null;

function getModeForFile(filename) {
  if (filename === 'template.html') return 'xml';
  if (filename.endsWith('.jsx') || filename.endsWith('.js')) return 'javascript';
  return { name: 'javascript', json: true };
}

async function renderTemplates() {
  const container = document.getElementById('page-container');

  try {
    const templates = await API.get('/api/templates');
    const activeResp = await API.get('/api/templates/active');
    const activeName = activeResp.active;

    let editorTemplate = '';
    let editorFile = '';
    let editorOriginal = '';

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span>模板列表</span>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div class="btn-group" id="filter-btns">
              <button class="btn btn-sm cat-filter active" data-cat="全部" onclick="filterByCategory('全部', this)">全部</button>
              <button class="btn btn-sm cat-filter" data-cat="人设" onclick="filterByCategory('人设', this)">人设</button>
              <button class="btn btn-sm cat-filter" data-cat="诊股" onclick="filterByCategory('诊股', this)">诊股</button>
            </div>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>模板</th>
                <th>域名</th>
                <th>版本</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${templates.map(t => `
                <tr${t.name === activeName ? ' class="row-active"' : ''} data-category="${escHtml(t.category || '人设')}">
                  <td><strong>#${t.categoryIndex || 1} ${escHtml(t.name)}</strong> <span class="badge badge-cat clickable" onclick="saveCategory('${escAttr(t.name)}', '${t.category === '人设' ? '诊股' : '人设'}')" title="点击切换分类">${escHtml(t.category || '人设')}</span></td>
                  <td>
                    <input class="domain-input" value="${escHtml(t.domain || '')}" placeholder="example.com"
                      data-template="${escAttr(t.name)}"
                      onblur="saveDomain(this)" onkeydown="if(event.key==='Enter')this.blur()">
                  </td>
                  <td class="text-muted">${t.version || '—'}</td>
                  <td>${t.name === activeName
                    ? '<span class="badge badge-green">当前</span>'
                    : `<button class="btn btn-sm btn-primary" onclick="activateTemplate('${escAttr(t.name)}')">设为当前</button>`
                  }</td>
                  <td>
                    <div class="btn-group">
                      <button class="btn btn-sm" onclick="openEditor('${escAttr(t.name)}', 'template.html')">编辑 HTML</button>
                      <button class="btn btn-sm" onclick="openEditor('${escAttr(t.name)}', 'config.json')">编辑配置</button>
                      <button class="btn btn-sm" onclick="openPopupEditor('${escAttr(t.name)}')">弹窗</button>
                      <button class="btn btn-sm btn-success" onclick="previewTemplate('${escAttr(t.name)}', '${escAttr(t.domain || '')}')">预览</button>
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
            <div class="btn-group" style="margin:0 12px" id="editor-tabs">
              <button class="btn btn-sm tab-item active" data-file="template.html" onclick="switchEditorTab('template.html', this)">HTML</button>
              <button class="btn btn-sm tab-item" data-file="config.json" onclick="switchEditorTab('config.json', this)">配置</button>
            </div>
            <button class="btn btn-sm" onclick="closeEditor()" style="margin-left:auto">&times; 关闭</button>
          </div>
          <div class="code-status" id="editor-status">就绪</div>
          <div id="code-editor-container"></div>
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
                <option value="manual">手动触发</option>
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

    // ---- 域名编辑 ----
    window.saveDomain = async (input) => {
      const name = input.getAttribute('data-template');
      const domain = input.value.trim();
      try {
        await API.put(`/api/templates/${name}/settings`, { domain });
        showToast(`域名已保存: ${domain || '(已清空)'}`, 'success');
      } catch (e) { showToast(e.message, 'error'); }
    };

    // ---- 分类筛选 ----
    window.filterByCategory = (cat, btn) => {
      document.querySelectorAll('.cat-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('tbody tr').forEach(tr => {
        const rowCat = tr.getAttribute('data-category');
        tr.style.display = (cat === '全部' || rowCat === cat) ? '' : 'none';
      });
    };

    // ---- 分类编辑（点击徽章切换）----
    window.saveCategory = async (name, category) => {
      try {
        await API.put(`/api/templates/${name}/category`, { category });
        showToast(`${name} → ${category}`, 'success');
        renderTemplates();
      } catch (e) { showToast(e.message, 'error'); }
    };

    // ---- 预览模板 ----
    window.previewTemplate = (name, domain) => {
      let url;
      if (domain) {
        url = 'https://' + domain;
      } else {
        url = window.location.origin + '/_preview/' + encodeURIComponent(name);
      }
      window.open(url, '_blank', 'noopener');
    };

    // ---- CodeMirror 初始化 ----
    function initCodeMirror() {
      if (cmInstance) return;
      const container = document.getElementById('code-editor-container');
      if (!container) return;
      cmInstance = CodeMirror(container, {
        value: '',
        mode: 'xml',
        theme: 'monokai',
        lineNumbers: true,
        tabSize: 2,
        indentWithTabs: false,
        lineWrapping: true,
        viewportMargin: Infinity
      });
      cmInstance.on('change', function () {
        const changed = cmInstance.getValue() !== editorOriginal;
        document.getElementById('editor-status').textContent = changed
          ? `${editorFile} — 未保存的更改`
          : `${editorFile}`;
      });
    }

    function destroyCodeMirror() {
      if (cmInstance) {
        const el = cmInstance.getWrapperElement();
        if (el && el.parentNode) el.parentNode.removeChild(el);
        cmInstance = null;
      }
    }

    // ---- 文件编辑器 ----
    window.openEditor = async (name, file) => {
      editorTemplate = name;
      editorFile = file;
      try {
        const files = await API.get(`/api/templates/${name}/files`);
        const content = files[file] || '';
        editorOriginal = content;

        // Destroy old CM instance and re-create container
        destroyCodeMirror();
        const oldContainer = document.getElementById('code-editor-container');
        if (oldContainer) oldContainer.remove();
        const newContainer = document.createElement('div');
        newContainer.id = 'code-editor-container';
        const modalContent = document.getElementById('editor-modal').querySelector('.modal-content');
        const btnGroup = modalContent.querySelectorAll('.btn-group')[1];
        modalContent.insertBefore(newContainer, btnGroup);

        initCodeMirror();
        cmInstance.setValue(content);
        cmInstance.setOption('mode', getModeForFile(file));
        cmInstance.refresh();

        document.getElementById('editor-title').textContent = `${name} / ${file}`;
        document.getElementById('editor-status').textContent = `${file} — ${content.length} 字符`;
        document.getElementById('editor-save-status').style.display = 'none';

        // Update tabs: show React source tabs if they exist
        const tabs = document.getElementById('editor-tabs');
        const reactTabs = [
          { file: 'src/App.jsx', label: 'App.jsx' },
          { file: 'src/index.css', label: 'CSS' },
        ];
        // Remove old React tabs
        tabs.querySelectorAll('.react-tab').forEach(t => t.remove());
        // Add React tabs if files exist
        reactTabs.forEach(rt => {
          if (files[rt.file] !== undefined) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm tab-item react-tab';
            btn.setAttribute('data-file', rt.file);
            btn.onclick = function() { switchEditorTab(rt.file, this); };
            btn.textContent = rt.label;
            if (rt.file === file) btn.classList.add('active');
            tabs.appendChild(btn);
          }
        });

        // Highlight active tab
        document.querySelectorAll('#editor-modal .tab-item').forEach(t => {
          t.classList.toggle('active', t.getAttribute('data-file') === file);
        });

        document.getElementById('editor-modal').style.display = 'flex';
        setTimeout(() => { if (cmInstance) cmInstance.refresh(); }, 100);
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
        if (cmInstance) {
          cmInstance.setValue(content);
          cmInstance.setOption('mode', getModeForFile(file));
          cmInstance.refresh();
        }
        document.getElementById('editor-title').textContent = `${editorTemplate} / ${file}`;
        document.getElementById('editor-status').textContent = `${file} — ${content.length} 字符`;
        document.getElementById('editor-save-status').style.display = 'none';
      } catch (e) { showToast(e.message, 'error'); }
    };

    window.saveCurrentFile = async () => {
      const content = cmInstance ? cmInstance.getValue() : '';
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
