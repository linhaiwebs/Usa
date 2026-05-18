const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

  let list = dirs.map(name => {
    const tmpl = settings.templates.find(t => t.name === name) || { name, githubRepo: '', domain: '', lastSync: null, lastSyncHash: '' };
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
  // Also read React source files if they exist
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
  // Ensure parent directory exists
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
    tmpl = { name, githubRepo: '', domain: '', lastSync: null, lastSyncHash: '' };
    settings.templates.push(tmpl);
  }
  if (data.githubRepo !== undefined) tmpl.githubRepo = data.githubRepo;
  if (data.domain !== undefined) tmpl.domain = data.domain;
  storage.write(FILE, settings);
  return tmpl;
}

function computeTemplateHash(name) {
  const files = getTemplateFiles(name);
  const hash = crypto.createHash('sha256');
  const sorted = Object.keys(files).sort();
  for (const f of sorted) {
    hash.update(f + '\0' + (files[f] || '') + '\0');
  }
  return hash.digest('hex');
}

function isTemplateModified(name) {
  const settings = getSettings();
  const tmpl = settings.templates.find(t => t.name === name);
  if (!tmpl || !tmpl.lastSyncHash) return false;
  return computeTemplateHash(name) !== tmpl.lastSyncHash;
}

function readTemplateDirsFromPath(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules')
    .filter(d => {
      // A template dir must have template.html or config.json
      const hasIndex = fs.existsSync(path.join(dirPath, d.name, 'template.html'));
      const hasConfig = fs.existsSync(path.join(dirPath, d.name, 'config.json'));
      return hasIndex || hasConfig;
    })
    .map(d => d.name);
}

const REPO_URL = 'https://github.com/linhaiwebs/Usa.git';

async function syncFromGithub(templateName) {
  const settings = getSettings();
  const git = simpleGit();
  const tmpDir = path.join(TEMPLATES_DIR, '.sync-tmp');

  // 1. Backup local templates that were modified
  const existingDirs = readTemplateDirsFromPath(TEMPLATES_DIR);
  const modifiedBackups = {};

  for (const name of existingDirs) {
    if (isTemplateModified(name)) {
      const srcDir = path.join(TEMPLATES_DIR, name);
      modifiedBackups[name] = backupDir(srcDir);
    }
  }

  // 2. Clone or pull the repo into temp dir
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });

  try {
    if (fs.existsSync(path.join(tmpDir, '.git'))) {
      await git.cwd(tmpDir).pull('origin', 'main');
    } else {
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
      await git.clone(REPO_URL, tmpDir);
    }
  } catch (e) {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
    await git.clone(REPO_URL, tmpDir);
  }

  // 3. Discover template dirs from the templates/ subdirectory in the repo
  const repoTemplatesDir = path.join(tmpDir, 'templates');
  const repoTemplates = readTemplateDirsFromPath(repoTemplatesDir);

  if (repoTemplates.length === 0) {
    // Clean up and throw
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
    throw new Error('No template directories found in repository');
  }

  // 4. Full copy all template dirs from GitHub (overwrite)
  const syncedNames = [];

  for (const name of repoTemplates) {
    const srcDir = path.join(repoTemplatesDir, name);
    const destDir = path.join(TEMPLATES_DIR, name);
    copyDir(srcDir, destDir);
    syncedNames.push(name);
  }

  // 5. Restore locally modified templates on top of GitHub version
  for (const [name, backupPath] of Object.entries(modifiedBackups)) {
    if (fs.existsSync(backupPath)) {
      copyDir(backupPath, path.join(TEMPLATES_DIR, name));
      fs.rmSync(backupPath, { recursive: true });
    }
  }

  // 6. Update settings: add any new templates, update sync hashes
  for (const name of syncedNames) {
    let tmpl = settings.templates.find(t => t.name === name);
    if (!tmpl) {
      tmpl = { name, githubRepo: '', lastSync: null, lastSyncHash: '' };
      settings.templates.push(tmpl);
    }
    tmpl.lastSync = new Date().toISOString();
    tmpl.lastSyncHash = computeTemplateHash(name);
  }
  storage.write(FILE, settings);

  // 7. Cleanup temp
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });

  return { success: true, synced: syncedNames, templates: listTemplates() };
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function backupDir(srcDir) {
  const tmpBackup = path.join(TEMPLATES_DIR, '.backup-' + Date.now() + '-' + path.basename(srcDir));
  copyDir(srcDir, tmpBackup);
  return tmpBackup;
}

function updateTemplateCategory(name, category) {
  const configPath = path.join(TEMPLATES_DIR, name, 'config.json');
  if (!fs.existsSync(configPath)) return null;
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  config.category = category;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  return config;
}

module.exports = { getSettings, getActiveTemplate, listTemplates, setActiveTemplate, getTemplateFiles, saveTemplateFile, getTemplatePath, syncFromGithub, updateTemplateSettings, updateTemplateCategory, computeTemplateHash };
