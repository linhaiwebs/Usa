const analyticsService = require('../services/analytics-service');
const popupService = require('../services/popup-service');

function getGAScript(config) {
  if (!config.enabled || !config.gtmId) return '';
  const gtm = config.gtmId;
  let ads = '';
  if (config.adsConversionId) {
    ads = `
  gtag('config', '${config.adsConversionId}'${config.adsConversionLabel ? `, { 'conversion_label': '${config.adsConversionLabel}' }` : ''});`;
  }
  return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${gtm}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gtm}');${ads}</script>
<!-- End Google Tag Manager -->`;
}

function getPopupScript(config) {
  if (!config.enabled || !config.content) return '';
  const popupData = JSON.stringify(config);
  const safeTitle = (config.title || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
  const safeContent = config.content
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
  return `<script>
(function(){
  var cfg = ${popupData};
  var shown = false;
  var isOpen = false;

  function createPopup() {
    if (shown && cfg.showOnce) return;
    var overlay = document.createElement('div');
    overlay.className = 'lp-popup-overlay';
    overlay.id = 'lp-popup';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<div class="lp-popup-box">'
      + '<button class="lp-popup-close" aria-label="Close">&times;</button>'
      + (cfg.title ? '<h3>' + '${safeTitle}' + '</h3>' : '')
      + '<div class="lp-popup-body">${safeContent}</div>'
      + '</div>';
    document.body.appendChild(overlay);
    shown = true;
    isOpen = true;
    document.body.style.overflow = 'hidden';

    // Close handlers
    overlay.querySelector('.lp-popup-close').addEventListener('click', closePopup);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePopup();
    });
    document.addEventListener('keydown', escHandler);
  }

  function closePopup() {
    var el = document.getElementById('lp-popup');
    if (el) el.remove();
    isOpen = false;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', escHandler);
  }

  function escHandler(e) {
    if (e.key === 'Escape') closePopup();
  }

  // Global function for CTA buttons to trigger the popup
  window.showSitePopup = function() {
    if (isOpen) return;
    createPopup();
    // Track click
    if (typeof gtag !== 'undefined') {
      gtag('event', 'cta_click', { event_category: 'popup', event_label: 'manual_trigger' });
    }
  };

  // Auto-show based on config
  if (cfg.type === 'exit-intent') {
    document.addEventListener('mouseout', function(e) {
      if (e.clientY < 0 && !isOpen) createPopup();
    });
  } else if (cfg.delay > 0) {
    setTimeout(function() {
      if (!isOpen) createPopup();
    }, cfg.delay);
  }
})();
<\/script>`;
}

function inject(html) {
  const analytics = analyticsService.get();
  const popup = popupService.get();
  return html
    .replace('</head>', `${getGAScript(analytics)}</head>`)
    .replace('</body>', `${getPopupScript(popup)}</body>`);
}

module.exports = { inject, getGAScript, getPopupScript };
