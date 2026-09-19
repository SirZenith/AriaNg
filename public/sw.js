const CACHE_NAME = 'ariang-v1';
const NETWORK_ONLY_SUFFIXES = ['manifest.json', 'sw.js'];

self.addEventListener('install', (event) => {
    const scope = self.registration.scope;

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll([scope, scope + 'index.html']))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    if (NETWORK_ONLY_SUFFIXES.some((name) => url.pathname.endsWith(name))) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match(self.registration.scope + 'index.html')));
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            const network = fetch(request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const clone = response.clone();

                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }

                    return response;
                })
                .catch(() => cached);

            return cached || network;
        }),
    );
});
