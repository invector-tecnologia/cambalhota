const CACHE_NAME = 'tavolo-static-v2';
const RUNTIME_CACHE = 'tavolo-runtime-v2';
const DATA_CACHE = 'tavolo-data-v2';
const OFFLINE_URL = '/offline';

// URLs que devem ser cacheadas imediatamente
const URLS_TO_CACHE = [
  '/',
  '/offline'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cache criado');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, RUNTIME_CACHE, DATA_CACHE].includes(cacheName)) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  if ('navigationPreload' in self.registration) {
    self.registration.navigationPreload.enable();
  }
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const acceptHeader = request.headers.get('accept') || '';
  const isNavigation = request.mode === 'navigate' || acceptHeader.includes('text/html');
  const isJson = acceptHeader.includes('application/json') || request.destination === '';
  const isPrintRoute = url.pathname.includes('/imprimir');

  if (!isSameOrigin) {
    return;
  }

  if (isPrintRoute) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  if (isNavigation) {
    event.respondWith(networkFirstForHtml(event));
    return;
  }

  if (isJson) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  event.respondWith(cacheFirst(request, RUNTIME_CACHE));
});

async function networkFirstForHtml(event) {
  const { request } = event;
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, preload.clone());
      return preload;
    }
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return caches.match(OFFLINE_URL);
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response && response.status === 200) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkFetch;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response(
    JSON.stringify({
      error: true,
      message: 'Você está offline. Dados serão servidos do cache quando disponível.',
      offline: true
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Evento de sincronização em background (quando voltar online)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sincronizar em background:', event.tag);
  
  if (event.tag === 'sync-queue') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_QUEUE',
            action: 'start'
          });
        });
      })
    );
  }
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const urls = Array.isArray(data?.urls) ? data.urls : [];
        await Promise.allSettled(
          urls.map(async (url) => {
            try {
              const response = await fetch(url, { credentials: 'include' });
              if (response && response.status === 200) {
                await cache.put(url, response.clone());
              }
            } catch (error) {
              console.warn('[Service Worker] Falha ao cachear URL:', url, error);
            }
          })
        );
      })
    );
  }
});
