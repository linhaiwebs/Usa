async function renderAnalytics() {
  const container = document.getElementById('page-container');

  try {
    const cfg = await API.get('/api/analytics');
    container.innerHTML = `
      <div class="card">
        <div class="card-header">谷歌分析配置</div>
        <div class="form-check">
          <input type="checkbox" id="ana-enabled" ${cfg.enabled ? 'checked' : ''} onchange="autoSaveAnalytics()">
          <label for="ana-enabled" style="margin:0;cursor:pointer">启用谷歌分析</label>
        </div>
        <div class="form-group">
          <label>谷歌标签 ID</label>
          <input id="ana-gtag" value="${escapeHtml(cfg.gtagId || '')}" placeholder="AW-17303658824" onchange="autoSaveAnalytics()">
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Google Ads 全局标签，格式 AW-XXXXXXXXX</div>
        </div>
        <div class="form-group">
          <label>GA4 衡量 ID</label>
          <input id="ana-ga4" value="${escapeHtml(cfg.ga4Id || '')}" placeholder="G-BDPP2WPMQR" onchange="autoSaveAnalytics()">
          <div style="font-size:11px;color:var(--muted);margin-top:2px">GA4 媒体资源的衡量 ID，格式 G-XXXXXXXXXX</div>
        </div>
        <div class="form-group">
          <label>转化 ID</label>
          <input id="ana-conv" value="${escapeHtml(cfg.conversionId || '')}" placeholder="AW-17303658824/KrXGCNHaoZQcEMjCg7tA" onchange="autoSaveAnalytics()">
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Google Ads 转化操作 ID，含 / 后缀的完整路径</div>
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-primary" onclick="saveAnalytics()">保存设置</button>
          <span id="ana-status" style="font-size:11px;color:var(--green);margin-left:8px;display:none">已保存</span>
        </div>
      </div>
    `;

    window.autoSaveAnalytics = () => {};
    window.saveAnalytics = async () => {
      const data = {
        enabled: document.getElementById('ana-enabled').checked,
        gtagId: document.getElementById('ana-gtag').value.trim(),
        ga4Id: document.getElementById('ana-ga4').value.trim(),
        conversionId: document.getElementById('ana-conv').value.trim()
      };
      try {
        await API.put('/api/analytics', data);
        const s = document.getElementById('ana-status');
        s.style.display = 'inline';
        setTimeout(() => s.style.display = 'none', 1500);
        showToast('分析设置已保存', 'success');
      } catch (e) { showToast(e.message, 'error'); }
    };
  } catch (e) {
    container.innerHTML = `<div class="card"><div class="empty-state"><p>加载失败: ${e.message}</p></div></div>`;
  }
}
