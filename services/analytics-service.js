const storage = require('./storage');

const FILE = 'analytics.json';

function get() {
  return storage.read(FILE);
}

function update(data) {
  const current = get();
  const updated = { ...current, ...data };
  storage.write(FILE, updated);
  return updated;
}

module.exports = { get, update };
