const CACHE_NAME = "abyss-timer-react-v2";

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("ネットワークとオフラインキャッシュの両方で取得できませんでした。");
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("abyss-timer-react-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const scopePath = new URL(self.registration.scope).pathname;
  const isHashedBuildAsset = url.origin === self.location.origin && url.pathname.startsWith(`${scopePath}assets/`);

  // HTML・manifest・開発モジュールは常にネットワーク優先。
  // cache-firstにするのはViteがハッシュ名を付けた本番資産だけに限定する。
  if (event.request.mode === "navigate" || !isHashedBuildAsset) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 内容がURLにより不変なVite本番資産だけは速いcache-firstで返す。
  event.respondWith(caches.match(event.request).then((cached) => cached || networkFirst(event.request)));
});
