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
        <div class="form-group"><label>GTM 容器 ID</label><input id="ana-gtm" value="${escapeHtml(cfg.gtmId || '')}" placeholder="GTM-XXXXXXX" onchange="autoSaveAnalytics()"></div>
        <div class="form-group"><label>谷歌广告转化 ID</label><input id="ana-ads-id" value="${escapeHtml(cfg.adsConversionId || '')}" placeholder="AW-XXXXXXXX" onchange="autoSaveAnalytics()"></div>
        <div class="form-group"><label>广告转化标签</label><input id="ana-ads-label" value="${escapeHtml(cfg.adsConversionLabel || '')}" placeholder="转化标签" onchange="autoSaveAnalytics()"></div>
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
        gtmId: document.getElementById('ana-gtm').value.trim(),
        adsConversionId: document.getElementById('ana-ads-id').value.trim(),
        adsConversionLabel: document.getElementById('ana-ads-label').value.trim()
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
