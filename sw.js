// 주술회전 일본어노트 — 오프라인 저장 (온라인이면 최신본, 오프라인이면 저장본)
// 새 달(data/mNN.js)을 추가하면 VERSION 숫자를 올리고 FILES에 파일명을 넣을 것
const VERSION = 'jjnote-v1';
const FILES = ['./', 'index.html', 'data/m01.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 글꼴: 한 번 받으면 저장본 사용
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => hit ||
      fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }

  // 앱 파일: 최신본 먼저, 실패하면 저장본
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
  }
});
