(function () {
  const pages = {
    dashboard: { title: 'Dashboard', render: renderDashboard },
    'split-routes': { title: 'Split Routes', render: renderSplitRoutes },
    analytics: { title: 'Analytics', render: renderAnalytics },
    templates: { title: 'Templates', render: renderTemplates }
  };

  function navigate(page) {
    const def = pages[page];
    if (!def) return navigate('dashboard');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const nav = document.querySelector(`[data-page="${page}"]`);
    if (nav) nav.classList.add('active');

    document.getElementById('page-title').textContent = def.title;
    def.render();
    window.location.hash = page;
  }

  function handleHash() {
    const page = window.location.hash.replace('#', '') || 'dashboard';
    navigate(page);
  }

  window.addEventListener('hashchange', handleHash);

  // Click on nav items
  document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
      e.preventDefault();
      const page = navItem.dataset.page;
      navigate(page);
    }
  });

  // SSE hot reload
  const evtSource = new EventSource('/api/hotreload');
  evtSource.addEventListener('reload', (e) => {
    const data = JSON.parse(e.data);
    showToast(`Template file changed: ${data.file}`, 'success');
  });
  evtSource.onerror = () => {
    document.getElementById('connection-status').textContent = '● Disconnected';
    document.getElementById('connection-status').classList.add('disconnected');
  };

  // Initial load
  handleHash();

  // Periodically check which template is active on the templates page
  setInterval(async () => {
    if (window.location.hash === '#templates' || !window.location.hash || window.location.hash === '#dashboard') {
      // Lightweight - just checks connection
    }
  }, 30000);
})();
