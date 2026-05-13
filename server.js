require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const apiRoutes = require('./routes/api');
const injector = require('./middleware/injector');
const templateService = require('./services/template-service');

const app = express();
const PORT = process.env.PORT || 3000;
const TEMPLATES_DIR = path.join(__dirname, 'templates');

app.use(express.json());

// SSE clients for hot reload
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

// Basic auth middleware for admin panel
function basicAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    res.set('WWW-Authenticate', 'Basic realm="ADS Admin"');
    return res.status(401).send('Authentication required');
  }
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (user === 'adsadmin' && pass === 'Mm123567') return next();
  res.set('WWW-Authenticate', 'Basic realm="ADS Admin"');
  res.status(401).send('Invalid credentials');
}

// Admin panel (protected)
app.use('/adsadmin', basicAuth, express.static(path.join(__dirname, 'admin')));

// Landing page — render active template with injections
app.get('/', (req, res) => {
  const active = templateService.getActiveTemplate();
  if (!active.exists) return res.status(404).send('No active template found. Set one up in <a href="/adsadmin">Admin Panel</a>.');

  const htmlPath = path.join(active.dir, 'template.html');
  if (!fs.existsSync(htmlPath)) return res.status(404).send('Template HTML file missing.');

  let html = fs.readFileSync(htmlPath, 'utf-8');
  html = injector.inject(html);
  res.send(html);
});

// API routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/adsadmin (user: adsadmin / pass: Mm123567)`);
  console.log(`Landing page: http://localhost:${PORT}`);
});
