// Service Worker para Script de Atendimento Fibramar
// Versão otimizada com cache inteligente

const CACHE_NAME = 'fibramar-script-v2.1.0';
const STATIC_CACHE = 'fibramar-static-v1';
const DYNAMIC_CACHE = 'fibramar-dynamic-v1';

// Recursos críticos para cache
const STATIC_ASSETS = [
    '/',
    '/Script_Atendimento_Fibramar.html',
    '/styles.css',
    '/script.js',
    '/script-data.json'
];

// URLs externas para cache dinâmico
const EXTERNAL_APIS = [
    'https://api.open-meteo.com',
    'https://castrox-dev.github.io',
    'https://raw.githubusercontent.com'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Cache estático criado');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Recursos estáticos em cache');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Erro na instalação', error);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Ativando...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Remove caches antigos
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Removendo cache antigo', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Ativado');
                return self.clients.claim();
            })
    );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Cache First para recursos estáticos
    if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }
    
    // Network First para APIs externas
    if (EXTERNAL_APIS.some(api => request.url.includes(api))) {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
        return;
    }
    
    // Network Only para outras requisições
    event.respondWith(fetch(request));
});

// Estratégia Cache First
async function cacheFirst(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // Atualiza cache em background
            updateCache(request, cache);
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
        
    } catch (error) {
        console.error('Cache First falhou:', error);
        return new Response('Recurso indisponível', { status: 503 });
    }
}

// Estratégia Network First
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.warn('Network falhou, tentando cache:', error);
        
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return new Response('Recurso indisponível offline', { status: 503 });
    }
}

// Atualização de cache em background
async function updateCache(request, cache) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
    } catch (error) {
        console.warn('Falha na atualização do cache:', error);
    }
}

// Limpeza periódica de cache
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CLEAN_CACHE') {
        cleanOldCache();
    }
});

async function cleanOldCache() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        for (const request of requests) {
            const response = await cache.match(request);
            const dateHeader = response.headers.get('date');
            
            if (dateHeader) {
                const cacheDate = new Date(dateHeader).getTime();
                if (now - cacheDate > maxAge) {
                    await cache.delete(request);
                }
            }
        }
        
        console.log('Service Worker: Cache limpo');
    } catch (error) {
        console.error('Erro na limpeza do cache:', error);
    }
}