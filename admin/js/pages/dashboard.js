async function renderDashboard() {
  const container = document.getElementById('page-container');
  container.innerHTML = '<div class="stats-grid" id="stats-grid"><div class="stat-card"><div class="stat-value">...</div><div class="stat-label">加载中</div></div></div>';

  try {
    const stats = await API.get('/api/stats');
    const analytics = await API.get('/api/analytics');
    const templates = await API.get('/api/templates');
    const active = await API.get('/api/templates/active');
    const popup = await API.get(`/api/templates/${active.active}/popup`);

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${stats.totalRoutes}</div><div class="stat-label">分流路由总数</div></div>
        <div class="stat-card"><div class="stat-value">${stats.activeRoutes}</div><div class="stat-label">启用路由</div></div>
        <div class="stat-card"><div class="stat-value">${stats.totalCalls}</div><div class="stat-label">总调用次数</div></div>
        <div class="stat-card"><div class="stat-value"><span style="font-size:13px">${analytics.enabled ? '<span class="badge badge-green">开启</span>' : '<span class="badge badge-red">关闭</span>'}</span></div><div class="stat-label">谷歌分析</div></div>
        <div class="stat-card"><div class="stat-value"><span style="font-size:13px">${popup.enabled ? '<span class="badge badge-green">开启</span>' : '<span class="badge badge-red">关闭</span>'}</span></div><div class="stat-label">弹窗 (${active.active})</div></div>
        <div class="stat-card"><div class="stat-value">${templates.length}</div><div class="stat-label">模板数量</div></div>
      </div>
      <div class="card">
        <div class="card-header">系统概览</div>
        <table>
          <tr><td style="width:180px" class="text-muted">当前模板</td><td>${active.active}</td></tr>
          <tr><td class="text-muted">热重载</td><td><span class="badge badge-green">运行中</span></td></tr>
          <tr><td class="text-muted">运行环境</td><td>生产环境</td></tr>
        </table>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="card"><div class="empty-state"><p>加载仪表盘失败: ${e.message}</p></div></div>`;
  }
}
