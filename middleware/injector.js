const analyticsService = require('../services/analytics-service');

function getGAScript(config) {
  if (!config.enabled || !config.gtmId) return '';
  const gtm = config.gtmId;
  let ads = '';
  if (config.adsConversionId) {
    ads = `\n  gtag('config', '${config.adsConversionId}'${config.adsConversionLabel ? `, { 'conversion_label': '${config.adsConversionLabel}' }` : ''});`;
  }
  return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${gtm}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gtm}');${ads}</script>
<!-- End Google Tag Manager -->`;
}

function getPopupCSS() {
  return `<style>
.lp-popup-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:lpFadeIn .22s ease}
@keyframes lpFadeIn{from{opacity:0}to{opacity:1}}
@keyframes lpPopIn{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
.lp-popup-box{background:radial-gradient(circle at top,rgba(15,23,42,.98),transparent 65%),#050816;border:1px solid rgba(248,113,113,.55);border-radius:20px;padding:2rem 1.8rem 1.8rem;max-width:460px;width:100%;position:relative;box-shadow:0 40px 120px rgba(0,0,0,1),0 0 80px rgba(248,113,113,.35);animation:lpPopIn .3s ease;text-align:center}
.lp-popup-close{position:absolute;top:12px;right:16px;background:none;border:none;color:#9ca3af;font-size:24px;cursor:pointer;line-height:1;transition:color .15s;font-family:Inter,sans-serif}
.lp-popup-close:hover{color:#e5e7eb}
.lp-popup-box h3{font-size:1.15rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#fee2e2;margin-bottom:.5rem;text-shadow:0 0 10px rgba(248,113,113,.8)}
.lp-popup-box p{font-size:.84rem;color:#9ca3af;margin-bottom:.6rem;line-height:1.5}
.lp-popup-body a[data-cta="split"]{display:inline-block;width:100%;padding:.9rem 1.5rem;border-radius:999px;font-weight:800;font-size:.9rem;text-decoration:none;box-sizing:border-box}
@media(max-width:480px){.lp-popup-box{padding:1.5rem 1.2rem 1.4rem}.lp-popup-box h3{font-size:1rem}}
<\/style>`;
}

function getPopupScript(config, splitUrl) {
  if (!config.enabled || !config.content) return '';

  // Replace {{split_url}} placeholder with actual split route URL
  const resolvedContent = (config.content || '').replace(/\{\{split_url\}\}/g, splitUrl || '#');

  const safeTitle = (config.title || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
  const safeContent = resolvedContent
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');

  return getPopupCSS() + `<script>
(function(){
  var cfg = ${JSON.stringify({ ...config, content: resolvedContent })};
  var shown = false;
  var isOpen = false;

  function splitUrl() { return '${(splitUrl || '#').replace(/'/g, "\\'")}'; }

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

    // Wire up CTA links with split URL after DOM insert
    var cta = overlay.querySelector('[data-cta="split"]');
    if (cta) {
      cta.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = splitUrl();
      });
    }

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

  window.showSitePopup = function() {
    if (isOpen) return;
    createPopup();
    if (typeof gtag !== 'undefined') {
      gtag('event', 'cta_click', { event_category: 'popup', event_label: 'manual_trigger' });
    }
  };

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

function inject(html, { analytics, popup, splitUrl } = {}) {
  return html
    .replace('</head>', `${getGAScript(analytics || analyticsService.get())}</head>`)
    .replace('</body>', `${getPopupScript(popup || {}, splitUrl || '')}</body>`);
}

module.exports = { inject, getGAScript, getPopupScript };
