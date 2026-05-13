async function renderDashboard() {
  const container = document.getElementById('page-container');
  container.innerHTML = '<div class="stats-grid" id="stats-grid"><div class="stat-card"><div class="stat-value">...</div><div class="stat-label">Loading</div></div></div>';

  try {
    const stats = await API.get('/api/stats');
    const analytics = await API.get('/api/analytics');
    const popups = await API.get('/api/popups');
    const templates = await API.get('/api/templates');

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${stats.totalRoutes}</div><div class="stat-label">Split Routes</div></div>
        <div class="stat-card"><div class="stat-value">${stats.activeRoutes}</div><div class="stat-label">Active Routes</div></div>
        <div class="stat-card"><div class="stat-value">${stats.totalCalls}</div><div class="stat-label">Total Route Calls</div></div>
        <div class="stat-card"><div class="stat-value"><span style="font-size:13px">${analytics.enabled ? '<span class="badge badge-green">ON</span>' : '<span class="badge badge-red">OFF</span>'}</span></div><div class="stat-label">Google Analytics</div></div>
        <div class="stat-card"><div class="stat-value"><span style="font-size:13px">${popups.enabled ? '<span class="badge badge-green">ON</span>' : '<span class="badge badge-red">OFF</span>'}</span></div><div class="stat-label">Popup</div></div>
        <div class="stat-card"><div class="stat-value">${templates.length}</div><div class="stat-label">Templates</div></div>
      </div>
      <div class="card">
        <div class="card-header">System Overview</div>
        <table>
          <tr><td style="width:180px" class="text-muted">Active Template</td><td>${templates.length ? (templates.find(t => t.name === (async () => { const r = await API.get('/api/templates/active'); return r.active; })()) || '—') : '—'}</td></tr>
          <tr><td class="text-muted">Hot Reload</td><td><span class="badge badge-green">Active</span></td></tr>
          <tr><td class="text-muted">Environment</td><td>production</td></tr>
        </table>
      </div>
    `;

    // Re-render with active template info
    try {
      const active = await API.get('/api/templates/active');
      container.querySelector('table td:nth-child(2)').textContent = active.active;
    } catch(e) {}
  } catch (e) {
    container.innerHTML = `<div class="card"><div class="empty-state"><p>Error loading dashboard: ${e.message}</p></div></div>`;
  }
}
