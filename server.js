require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const net = require('net');
const crypto = require('crypto');
const chokidar = require('chokidar');
const apiRoutes = require('./routes/api');
const injector = require('./middleware/injector');
const templateService = require('./services/template-service');
const popupService = require('./services/popup-service');
const splitService = require('./services/split-service');

const app = express();
const DATA_DIR = path.join(__dirname, 'data');
const PORT_FILE = path.join(DATA_DIR, '.port');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'ads-secret-' + crypto.randomBytes(16).toString('hex');
const ADMIN_USER = 'adsadmin';
const ADMIN_PASS = 'Mm123567';
const TOKEN_COOKIE = 'ads_token';

// --- Port auto-selection ---
function portInUse(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => { server.removeAllListeners(); resolve(true); });
    server.once('listening', () => { server.removeAllListeners(); server.close(() => resolve(false)); });
    server.listen(port, '0.0.0.0');
  });
}

function readLastPort() {
  try {
    if (fs.existsSync(PORT_FILE)) {
      const p = parseInt(fs.readFileSync(PORT_FILE, 'utf-8').trim(), 10);
      if (p >= 3000 && p < 65536) return p;
    }
  } catch (_) { /* ignore */ }
  return 0;
}

function savePort(port) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PORT_FILE, String(port), 'utf-8');
}

async function findPort() {
  const basePort = parseInt(process.env.PORT, 10) || readLastPort() || 3000;
  for (let offset = 0; offset < 100; offset++) {
    const port = basePort + offset;
    if (!(await portInUse(port))) {
      savePort(port);
      return port;
    }
  }
  throw new Error('No available port found (tried 3000–3100)');
}
// --- End port auto-selection ---

app.use(express.json());

// --- Cookie helper ---
function getCookie(req, name) {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// --- Token helpers ---
function createToken(user) {
  const payload = { user, time: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 };
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ d: data, h: hmac })).toString('base64url');
}

function verifyToken(token) {
  try {
    const { d, h } = JSON.parse(Buffer.from(token, 'base64url').toString());
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(d).digest('hex');
    if (h !== expected) return null;
    const payload = JSON.parse(d);
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (_) { return null; }
}

// --- Public routes (no auth) ---

// Login page
app.get('/adsadmin/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

// Login API
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    const token = createToken(user);
    res.cookie(TOKEN_COOKIE, token, { httpOnly: true, sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Logout API
app.post('/api/logout', (req, res) => {
  res.clearCookie(TOKEN_COOKIE);
  res.json({ success: true });
});

// SSE hot reload (public)
const sseClients = [];
function notifyClients(event, data) {
  sseClients.forEach(c => c.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}
app.get('/api/hotreload', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
  res.write('data: {"connected":true}\n\n');
  sseClients.push(res);
  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx >= 0) sseClients.splice(idx, 1);
  });
});

// Watch templates for hot reload
chokidar.watch(TEMPLATES_DIR, { ignoreInitial: true, depth: 2 }).on('change', (filePath) => {
  const rel = path.relative(TEMPLATES_DIR, filePath).replace(/\\/g, '/');
  notifyClients('reload', { file: rel });
});

// --- Admin auth middleware ---
app.use('/adsadmin', (req, res, next) => {
  // Allow login page through
  if (req.path === '/login.html') return next();
  // Allow CSS/JS for login page styling
  if (req.path === '/css/admin.css') return next();
  // Check token
  const token = getCookie(req, TOKEN_COOKIE);
  if (token && verifyToken(token)) return next();
  // Redirect to login
  res.redirect('/adsadmin/login.html');
});

// Admin static files
app.use('/adsadmin', express.static(path.join(__dirname, 'admin')));

// Template static assets (JS/CSS/images for built templates)
app.use('/_tmpl', express.static(TEMPLATES_DIR, { dotfiles: 'allow' }));

// --- API auth middleware ---
app.use('/api', (req, res, next) => {
  // Public endpoints
  if (req.path === '/hotreload') return next();
  if (req.path === '/login' || req.path === '/logout') return next();
  const token = getCookie(req, TOKEN_COOKIE);
  if (token && verifyToken(token)) return next();
  res.status(401).json({ error: 'Unauthorized' });
});

// Preview any template (public, no auth)
function serveTemplate(name, res) {
  const dir = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(dir)) return res.status(404).send('Template not found.');

  const htmlPath = path.join(dir, 'template.html');
  if (!fs.existsSync(htmlPath)) return res.status(404).send('Template HTML file missing.');

  let html = fs.readFileSync(htmlPath, 'utf-8');
  const popup = popupService.get(name);
  const splitEntry = splitService.getRandom();
  const splitUrl = splitEntry ? splitEntry.url : '';
  html = injector.inject(html, { popup, splitUrl });
  res.send(html);
}

app.get('/_preview/:name', (req, res) => {
  serveTemplate(req.params.name, res);
});

// Landing page (public)
app.get('/', (req, res) => {
  const active = templateService.getActiveTemplate();
  if (!active.exists) return res.status(404).send('No active template found. Set one up in <a href="/adsadmin">Admin Panel</a>.');

  serveTemplate(active.name, res);
});

// API routes
app.use('/api', apiRoutes);

findPort().then(PORT => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/adsadmin (user: ${ADMIN_USER} / pass: ${ADMIN_PASS})`);
    console.log(`Landing page: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
