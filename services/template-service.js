const fs = require('fs');
const path = require('path');
const storage = require('./storage');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const FILE = 'settings.json';

function ensureTemplatesDir() {
  if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

function getSettings() {
  return storage.read(FILE);
}

function getActiveTemplate() {
  const settings = getSettings();
  const name = settings.activeTemplate;
  const dir = path.join(TEMPLATES_DIR, name);
  return { name, dir, exists: fs.existsSync(dir) };
}

function listTemplates() {
  ensureTemplatesDir();
  const dirs = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  const settings = getSettings();

  let list = dirs.map(name => {
    const tmpl = settings.templates.find(t => t.name === name) || { name, domain: '' };
    let version = '', category = '人设';
    try {
      const configPath = path.join(TEMPLATES_DIR, name, 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        version = config.version || '';
        category = config.category || '人设';
      }
    } catch (_) { /* ignore */ }
    return { ...tmpl, version, category };
  });

  // Sort by category then by name, assign auto-increment index per category
  list.sort((a, b) => {
    if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
    return a.name.localeCompare(b.name);
  });

  const catCount = {};
  list.forEach(t => {
    if (!catCount[t.category]) catCount[t.category] = 0;
    catCount[t.category]++;
    t.categoryIndex = catCount[t.category];
  });

  return list;
}

function setActiveTemplate(name) {
  const settings = getSettings();
  const dir = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(dir)) return false;
  settings.activeTemplate = name;
  storage.write(FILE, settings);
  return true;
}

function getTemplateFiles(name) {
  const dir = path.join(TEMPLATES_DIR, name || getActiveTemplate().name);
  const result = {};
  const files = ['template.html', 'style.css', 'config.json'];
  const reactFiles = ['src/App.jsx', 'src/index.css', 'src/main.jsx'];
  const allFiles = files.concat(reactFiles);
  for (const f of allFiles) {
    const fp = path.join(dir, f);
    if (fs.existsSync(fp)) result[f] = fs.readFileSync(fp, 'utf-8');
  }
  return result;
}

function saveTemplateFile(name, filename, content) {
  const dir = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(dir)) return false;
  const fp = path.join(dir, filename);
  const parent = path.dirname(fp);
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  fs.writeFileSync(fp, content, 'utf-8');

  // Trigger Vite rebuild for React templates
  const isReact = fs.existsSync(path.join(dir, 'package.json'));
  const isSrc = filename.startsWith('src/');
  if (isReact && isSrc) {
    const { exec } = require('child_process');
    exec('npx vite build', { cwd: dir }, (err, stdout, stderr) => {
      if (err) console.error('[vite rebuild] Error:', stderr);
      else console.log('[vite rebuild] OK');
    });
  }

  return true;
}

function getTemplatePath(name) {
  return path.join(TEMPLATES_DIR, name);
}

function updateTemplateSettings(name, data) {
  const settings = getSettings();
  let tmpl = settings.templates.find(t => t.name === name);
  if (!tmpl) {
    tmpl = { name, domain: '' };
    settings.templates.push(tmpl);
  }
  if (data.domain !== undefined) tmpl.domain = data.domain;
  storage.write(FILE, settings);
  return tmpl;
}

function updateTemplateCategory(name, category) {
  const configPath = path.join(TEMPLATES_DIR, name, 'config.json');
  if (!fs.existsSync(configPath)) return null;
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  config.category = category;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  return config;
}

module.exports = { getSettings, getActiveTemplate, listTemplates, setActiveTemplate, getTemplateFiles, saveTemplateFile, getTemplatePath, updateTemplateSettings, updateTemplateCategory };
