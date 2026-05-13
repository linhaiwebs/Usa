async function renderPopups() {
  const container = document.getElementById('page-container');

  try {
    const cfg = await API.get('/api/popups');
    container.innerHTML = `
      <div class="card">
        <div class="card-header">Popup Configuration</div>
        <div class="form-check">
          <input type="checkbox" id="popup-enabled" ${cfg.enabled ? 'checked' : ''}>
          <label for="popup-enabled" style="margin:0;cursor:pointer">Enable Popup</label>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Trigger Type</label>
            <select id="popup-type">
              <option value="modal" ${cfg.type === 'modal' ? 'selected' : ''}>Modal (timed)</option>
              <option value="exit-intent" ${cfg.type === 'exit-intent' ? 'selected' : ''}>Exit Intent</option>
            </select>
          </div>
          <div class="form-group">
            <label>Delay (ms)</label>
            <input id="popup-delay" type="number" value="${cfg.delay || 5000}" placeholder="5000">
          </div>
        </div>
        <div class="form-group">
          <label>Title</label>
          <input id="popup-title" value="${escapeHtml(cfg.title || '')}" placeholder="Popup title">
        </div>
        <div class="form-group">
          <label>Content HTML</label>
          <textarea id="popup-content" style="min-height:180px" placeholder="<h2>Special Offer</h2><p>Your message here...</p>">${escapeHtml(cfg.content || '')}</textarea>
        </div>
        <div class="form-check">
          <input type="checkbox" id="popup-once" ${cfg.showOnce ? 'checked' : ''}>
          <label for="popup-once" style="margin:0;cursor:pointer">Show only once per session</label>
        </div>
        <div class="btn-group" style="margin-top:12px">
          <button class="btn btn-primary" onclick="savePopup()">Save Popup</button>
          <span id="popup-status" style="font-size:11px;color:var(--green);display:none;margin-left:8px">Saved &mdash; live</span>
        </div>
      </div>
      <div class="card" style="border-style:dashed">
        <div class="card-header">Preview</div>
        <div style="position:relative;min-height:160px;background:var(--bg);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;overflow:hidden">
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px 32px;max-width:360px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.4)" id="popup-preview">
            <button style="position:absolute;top:6px;right:10px;background:none;border:none;color:var(--text-secondary);font-size:18px;cursor:pointer">&times;</button>
            <div id="popup-preview-content">${cfg.content || '<p style="color:var(--text-secondary)">Popup preview will appear here</p>'}</div>
          </div>
        </div>
      </div>
    `;

    // Live preview as user types
    const contentEl = document.getElementById('popup-content');
    contentEl.addEventListener('input', () => {
      document.getElementById('popup-preview-content').innerHTML = contentEl.value || '<p style="color:var(--text-secondary)">Popup preview will appear here</p>';
    });

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
        await API.put('/api/popups', data);
        const s = document.getElementById('popup-status');
        s.style.display = 'inline';
        setTimeout(() => s.style.display = 'none', 2500);
        showToast('Popup saved — live on site', 'success');
      } catch (e) { showToast(e.message, 'error'); }
    };
  } catch (e) {
    container.innerHTML = `<div class="card"><div class="empty-state"><p>Error: ${e.message}</p></div></div>`;
  }
}
