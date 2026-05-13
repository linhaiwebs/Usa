const storage = require('./storage');
const { v4: uuidv4 } = require('uuid');

const FILE = 'split-routes.json';

function getAll() {
  return storage.read(FILE);
}

function getById(id) {
  return getAll().find(r => r.id === id) || null;
}

function create({ url, suffix = '' }) {
  const routes = getAll();
  const entry = { id: uuidv4(), url, suffix, callCount: 0, enabled: true, createdAt: new Date().toISOString() };
  routes.push(entry);
  storage.write(FILE, routes);
  return entry;
}

function update(id, data) {
  const routes = getAll();
  const idx = routes.findIndex(r => r.id === id);
  if (idx === -1) return null;
  routes[idx] = { ...routes[idx], ...data, id };
  storage.write(FILE, routes);
  return routes[idx];
}

function remove(id) {
  const routes = getAll();
  const filtered = routes.filter(r => r.id !== id);
  storage.write(FILE, filtered);
  return filtered.length < routes.length;
}

function getRandom() {
  const enabled = getAll().filter(r => r.enabled);
  if (enabled.length === 0) return null;
  const entry = enabled[Math.floor(Math.random() * enabled.length)];
  entry.callCount++;
  update(entry.id, { callCount: entry.callCount });
  return entry;
}

module.exports = { getAll, getById, create, update, remove, getRandom };
