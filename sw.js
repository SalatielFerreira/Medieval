// Service worker do MEDIEVAL: permite instalar o jogo como app e jogar sem internet.
// Sempre tenta a rede primeiro (assim as atualizações chegam na hora, como antes);
// sem internet, usa a última cópia guardada de cada arquivo.
const CACHE = 'medieval-app';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin, fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !fonts) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      // sem internet: a cópia exata, ou a mesma página/arquivo de outra versão (?v=...)
      const hit = await cache.match(req) || await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') { const home = await cache.match('./', { ignoreSearch: true }) || await cache.match('index.html', { ignoreSearch: true }); if (home) return home; }
      throw err;
    }
  })());
});
