const express = require('express');
const router = express.Router();
const splitService = require('../services/split-service');
const analyticsService = require('../services/analytics-service');
const templateService = require('../services/template-service');
const popupService = require('../services/popup-service');

// === Split Routes ===
router.get('/split', (req, res) => res.json(splitService.getAll()));
router.get('/split/random', (req, res) => {
  const entry = splitService.getRandom();
  if (!entry) return res.status(404).json({ error: 'No enabled routes' });
  res.json(entry);
});
router.post('/split', (req, res) => {
  const { url, suffix } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  res.status(201).json(splitService.create({ url, suffix }));
});
router.put('/split/:id', (req, res) => {
  const result = splitService.update(req.params.id, req.body);
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.json(result);
});
router.delete('/split/:id', (req, res) => {
  const ok = splitService.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// === Analytics ===
router.get('/analytics', (req, res) => res.json(analyticsService.get()));
router.put('/analytics', (req, res) => res.json(analyticsService.update(req.body)));

// === Templates ===
router.get('/templates', (req, res) => res.json(templateService.listTemplates()));
router.get('/templates/active', (req, res) => {
  const active = templateService.getActiveTemplate();
  res.json({ active: active.name, exists: active.exists });
});
router.put('/templates/active', (req, res) => {
  const ok = templateService.setActiveTemplate(req.body.name);
  if (!ok) return res.status(404).json({ error: 'Template not found' });
  res.json({ success: true });
});
router.get('/templates/:name/files', (req, res) => {
  const files = templateService.getTemplateFiles(req.params.name);
  res.json(files);
});
router.put('/templates/:name/files', (req, res) => {
  const { filename, content } = req.body;
  if (!filename || content === undefined) return res.status(400).json({ error: 'filename and content required' });
  const ok = templateService.saveTemplateFile(req.params.name, filename, content);
  if (!ok) return res.status(404).json({ error: 'Template not found' });
  res.json({ success: true });
});
router.put('/templates/:name/settings', (req, res) => {
  const result = templateService.updateTemplateSettings(req.params.name, req.body);
  res.json(result);
});
router.post('/templates/:name/sync', async (req, res) => {
  try {
    const result = await templateService.syncFromGithub(req.params.name);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === Popups ===
router.get('/popups', (req, res) => res.json(popupService.get()));
router.put('/popups', (req, res) => res.json(popupService.update(req.body)));

// === Stats ===
router.get('/stats', (req, res) => {
  const routes = splitService.getAll();
  const total = routes.reduce((s, r) => s + r.callCount, 0);
  const active = routes.filter(r => r.enabled).length;
  res.json({ totalRoutes: routes.length, activeRoutes: active, totalCalls: total });
});

module.exports = router;
