const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const DEFAULTS = {
  enabled: true,
  type: 'modal',
  title: 'Special Offer',
  content: '<p>Your popup content here...</p>',
  delay: 5000,
  showOnce: true
};

function getPath(templateName) {
  return path.join(TEMPLATES_DIR, templateName, 'popup.json');
}

function get(templateName) {
  const fp = getPath(templateName);
  if (fs.existsSync(fp)) {
    try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(fp, 'utf-8')) }; }
    catch (_) { return { ...DEFAULTS }; }
  }
  return { ...DEFAULTS };
}

function update(templateName, data) {
  const current = get(templateName);
  const updated = { ...current, ...data };
  const dir = path.join(TEMPLATES_DIR, templateName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getPath(templateName), JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

module.exports = { get, update };
