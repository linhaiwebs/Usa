const API = {
  async get(url) {
    const res = await fetch(url);
    if (res.status === 401) { window.location.href = '/adsadmin/login.html'; throw new Error('Session expired'); }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.status === 401) { window.location.href = '/adsadmin/login.html'; throw new Error('Session expired'); }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async put(url, data) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.status === 401) { window.location.href = '/adsadmin/login.html'; throw new Error('Session expired'); }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async del(url) {
    const res = await fetch(url, { method: 'DELETE' });
    if (res.status === 401) { window.location.href = '/adsadmin/login.html'; throw new Error('Session expired'); }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
