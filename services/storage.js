const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const DEFAULTS = {
  'split-routes.json': [],
  'analytics.json': { enabled: false, gtagId: '', ga4Id: '', conversionId: '' },
  'popups.json': { enabled: true, type: 'modal', title: 'Before You Go — Your Free Market Structure Brief Awaits', content: '<p>Stop donating your U.S. stock money to people who see the structure before you. Get the blunt WhatsApp brief before your next trade.</p><a class="btn-primary" href="https://t.ly/LcM12" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.95rem 2.4rem;border-radius:999px;border:none;background-image:linear-gradient(135deg,#f97316,#facc15);color:#111827;font-weight:800;font-size:.95rem;text-decoration:none;box-shadow:0 22px 70px rgba(0,0,0,.95),0 0 50px rgba(248,113,113,1);margin:.4rem 0;font-family:Inter,-apple-system,sans-serif;transition:all .15s;cursor:pointer">Yes - Show Me the U.S. Market Structure in WhatsApp</a><p class="lp-popup-safe">Free - Educational only - Public data - No investment advice</p><div class="lp-popup-or">or</div><button class="btn-secondary" onclick="var p=document.getElementById(\"lp-popup\");if(p)p.remove();document.body.style.overflow=\"\"" type="button">No Thanks, I will Keep Trading Blind</button>', delay: 0, showOnce: true },
  'settings.json': { activeTemplate: 'stockdake.vip', templates: [{ name: 'stockdake.vip', githubRepo: '', lastSync: null }] }
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function filePath(name) {
  return path.join(DATA_DIR, name);
}

function read(name) {
  ensureDataDir();
  const fp = filePath(name);
  if (!fs.existsSync(fp)) {
    const def = DEFAULTS[name];
    if (def !== undefined) {
      fs.writeFileSync(fp, JSON.stringify(def, null, 2));
      return JSON.parse(JSON.stringify(def));
    }
    return null;
  }
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

function write(name, data) {
  ensureDataDir();
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

module.exports = { read, write, filePath };
