async function renderSplitRoutes() {
  const container = document.getElementById('page-container');

  async function refresh() {
    const routes = await API.get('/api/split');
    render(routes);
  }

  function render(routes) {
    const rows = routes.length === 0
      ? '<tr><td colspan="6"><div class="empty-state"><p>No split routes created yet</p></div></td></tr>'
      : routes.map(r => `
        <tr>
          <td class="mono">${r.id.slice(0, 8)}...</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(r.url)}</td>
          <td>${escapeHtml(r.suffix || '—')}</td>
          <td>${r.callCount}</td>
          <td>${r.enabled ? '<span class="badge badge-green">On</span>' : '<span class="badge badge-red">Off</span>'}</td>
          <td>
            <div class="btn-group">
              <button class="btn btn-sm" onclick="toggleSplit('${r.id}', ${!r.enabled})">${r.enabled ? 'Disable' : 'Enable'}</button>
              <button class="btn btn-sm btn-danger" onclick="deleteSplit('${r.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span>Split Routes</span>
          <button class="btn btn-primary" onclick="showAddForm()">+ New Route</button>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>URL</th><th>Suffix</th><th>Calls</th><th>Status</th><th style="width:140px"></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>
      <div id="add-form" style="display:none">
        <div class="card">
          <div class="card-header">New Split Route</div>
          <div class="form-row">
            <div class="form-group"><label>URL</label><input id="new-url" placeholder="https://example.com"></div>
            <div class="form-group"><label>Suffix</label><input id="new-suffix" placeholder="?ref=landing"></div>
          </div>
          <div class="btn-group" style="margin-top:8px">
            <button class="btn btn-primary" onclick="createSplit()">Create</button>
            <button class="btn" onclick="document.getElementById('add-form').style.display='none'">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  window.showAddForm = () => document.getElementById('add-form').style.display = 'block';
  window.createSplit = async () => {
    const url = document.getElementById('new-url').value.trim();
    const suffix = document.getElementById('new-suffix').value.trim();
    if (!url) return showToast('URL is required', 'error');
    try {
      await API.post('/api/split', { url, suffix });
      showToast('Route created', 'success');
      refresh();
    } catch (e) { showToast(e.message, 'error'); }
  };
  window.toggleSplit = async (id, enable) => {
    try {
      await API.put(`/api/split/${id}`, { enabled: enable });
      showToast(enable ? 'Route enabled' : 'Route disabled', 'success');
      refresh();
    } catch (e) { showToast(e.message, 'error'); }
  };
  window.deleteSplit = async (id) => {
    if (!confirm('Delete this route?')) return;
    try {
      await API.del(`/api/split/${id}`);
      showToast('Route deleted', 'success');
      refresh();
    } catch (e) { showToast(e.message, 'error'); }
  };

  try { const routes = await API.get('/api/split'); render(routes); }
  catch(e) { container.innerHTML = `<div class="card"><div class="empty-state"><p>Error: ${e.message}</p></div></div>`; }
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
