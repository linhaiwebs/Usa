async function renderAnalytics() {
  const container = document.getElementById('page-container');

  try {
    const cfg = await API.get('/api/analytics');
    container.innerHTML = `
      <div class="card">
        <div class="card-header">Google Analytics Configuration</div>
        <div class="form-check">
          <input type="checkbox" id="ana-enabled" ${cfg.enabled ? 'checked' : ''} onchange="autoSaveAnalytics()">
          <label for="ana-enabled" style="margin:0;cursor:pointer">Enable Google Analytics</label>
        </div>
        <div class="form-group"><label>GTM Container ID</label><input id="ana-gtm" value="${escapeHtml(cfg.gtmId || '')}" placeholder="GTM-XXXXXXX" onchange="autoSaveAnalytics()"></div>
        <div class="form-group"><label>Google Ads Conversion ID</label><input id="ana-ads-id" value="${escapeHtml(cfg.adsConversionId || '')}" placeholder="AW-XXXXXXXX" onchange="autoSaveAnalytics()"></div>
        <div class="form-group"><label>Ads Conversion Label</label><input id="ana-ads-label" value="${escapeHtml(cfg.adsConversionLabel || '')}" placeholder="conversion label" onchange="autoSaveAnalytics()"></div>
        <div style="margin-top:12px">
          <button class="btn btn-primary" onclick="saveAnalytics()">Save Settings</button>
          <span id="ana-status" style="font-size:11px;color:var(--green);margin-left:8px;display:none">Saved</span>
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
        showToast('Analytics settings saved', 'success');
      } catch (e) { showToast(e.message, 'error'); }
    };
  } catch (e) {
    container.innerHTML = `<div class="card"><div class="empty-state"><p>Error: ${e.message}</p></div></div>`;
  }
}
