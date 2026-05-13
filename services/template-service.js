const fs = require('fs');
const path = require('path');
const storage = require('./storage');
const simpleGit = require('simple-git');

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
  return dirs.map(name => {
    const tmpl = settings.templates.find(t => t.name === name) || { name, githubRepo: '', lastSync: null };
    // Read version from config.json
    let version = '';
    try {
      const configPath = path.join(TEMPLATES_DIR, name, 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        version = config.version || '';
      }
    } catch (_) { /* ignore */ }
    return { ...tmpl, version };
  });
}

function updateTemplateSettings(name, data) {
  const settings = getSettings();
  let tmpl = settings.templates.find(t => t.name === name);
  if (!tmpl) {
    tmpl = { name, githubRepo: '', lastSync: null };
    settings.templates.push(tmpl);
  }
  if (data.githubRepo !== undefined) tmpl.githubRepo = data.githubRepo;
  storage.write(FILE, settings);
  return tmpl;
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
  for (const f of files) {
    const fp = path.join(dir, f);
    if (fs.existsSync(fp)) result[f] = fs.readFileSync(fp, 'utf-8');
  }
  return result;
}

function saveTemplateFile(name, filename, content) {
  const dir = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(dir)) return false;
  const fp = path.join(dir, filename);
  fs.writeFileSync(fp, content, 'utf-8');
  return true;
}

function getTemplatePath(name) {
  return path.join(TEMPLATES_DIR, name);
}

async function syncFromGithub(templateName) {
  const settings = getSettings();
  const tmpl = settings.templates.find(t => t.name === templateName);
  if (!tmpl || !tmpl.githubRepo) throw new Error('No GitHub repo configured for this template');

  const dir = path.join(TEMPLATES_DIR, templateName);
  const git = simpleGit();

  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, '.git'))) {
    await git.cwd(dir).pull('origin', 'main');
  } else {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
    await git.clone(tmpl.githubRepo, dir);
  }

  tmpl.lastSync = new Date().toISOString();
  storage.write(FILE, settings);
  return { success: true, lastSync: tmpl.lastSync };
}

module.exports = { getSettings, getActiveTemplate, listTemplates, setActiveTemplate, getTemplateFiles, saveTemplateFile, getTemplatePath, syncFromGithub, updateTemplateSettings };
