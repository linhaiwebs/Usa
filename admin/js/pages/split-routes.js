async function renderSplitRoutes() {
  const container = document.getElementById('page-container');

  async function refresh() {
    const routes = await API.get('/api/split');
    render(routes);
  }

  function render(routes) {
    const rows = routes.length === 0
      ? '<tr><td colspan="6"><div class="empty-state"><p>暂无分流路由</p></div></td></tr>'
      : routes.map(r => `
        <tr>
          <td class="mono">${r.id.slice(0, 8)}...</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(r.url)}</td>
          <td>${escapeHtml(r.suffix || '—')}</td>
          <td>${r.callCount}</td>
          <td>${r.enabled ? '<span class="badge badge-green">开启</span>' : '<span class="badge badge-red">关闭</span>'}</td>
          <td>
            <div class="btn-group">
              <button class="btn btn-sm" onclick="toggleSplit('${r.id}', ${!r.enabled})">${r.enabled ? '禁用' : '启用'}</button>
              <button class="btn btn-sm btn-danger" onclick="deleteSplit('${r.id}')">删除</button>
            </div>
          </td>
        </tr>
      `).join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span>分流路由</span>
          <button class="btn btn-primary" onclick="showAddForm()">+ 新建路由</button>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>URL</th><th>后缀</th><th>调用</th><th>状态</th><th style="width:130px"></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>
      <div id="add-form" style="display:none">
        <div class="card">
          <div class="card-header">新建分流路由</div>
          <div class="form-row">
            <div class="form-group"><label>URL</label><input id="new-url" placeholder="https://example.com"></div>
            <div class="form-group"><label>后缀</label><input id="new-suffix" placeholder="?ref=landing"></div>
          </div>
          <div class="btn-group" style="margin-top:8px">
            <button class="btn btn-primary" onclick="createSplit()">创建</button>
            <button class="btn" onclick="document.getElementById('add-form').style.display='none'">取消</button>
          </div>
        </div>
      </div>
    `;
  }

  window.showAddForm = () => document.getElementById('add-form').style.display = 'block';
  window.createSplit = async () => {
    const url = document.getElementById('new-url').value.trim();
    const suffix = document.getElementById('new-suffix').value.trim();
    if (!url) return showToast('请输入 URL', 'error');
    try {
      await API.post('/api/split', { url, suffix });
      showToast('路由已创建', 'success');
      refresh();
    } catch (e) { showToast(e.message, 'error'); }
  };
  window.toggleSplit = async (id, enable) => {
    try {
      await API.put(`/api/split/${id}`, { enabled: enable });
      showToast(enable ? '路由已启用' : '路由已禁用', 'success');
      refresh();
    } catch (e) { showToast(e.message, 'error'); }
  };
  window.deleteSplit = async (id) => {
    if (!confirm('确认删除此路由？')) return;
    try {
      await API.del(`/api/split/${id}`);
      showToast('路由已删除', 'success');
      refresh();
    } catch (e) { showToast(e.message, 'error'); }
  };

  try { const routes = await API.get('/api/split'); render(routes); }
  catch(e) { container.innerHTML = `<div class="card"><div class="empty-state"><p>加载失败: ${e.message}</p></div></div>`; }
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
