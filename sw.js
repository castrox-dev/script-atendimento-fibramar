// Service Worker para Script de Atendimento Fibramar
// Versão otimizada com cache inteligente e modo offline completo

const CACHE_NAME = 'fibramar-script-v2.3.0';
const STATIC_CACHE = 'fibramar-static-v3';
const DYNAMIC_CACHE = 'fibramar-dynamic-v3';
const ANALYTICS_CACHE = 'fibramar-analytics-v2';
const OFFLINE_CACHE = 'fibramar-offline-v1';

// Recursos críticos para cache
const STATIC_ASSETS = [
    './',
    './Script_Atendimento_Fibramar.html',
    './styles.css',
    './script.js',
    './script-data.json',
    './manifest.json'
];

// URLs externas para cache dinâmico
const EXTERNAL_APIS = [
    'https://api.open-meteo.com',
    'https://castrox-dev.github.io',
    'https://raw.githubusercontent.com'
];

// Dados offline para funcionalidade básica
const OFFLINE_DATA = {
    weather: {
        temperature: 25,
        description: 'Dados offline',
        humidity: 60,
        windSpeed: 10,
        lastUpdate: new Date().toISOString()
    },
    scriptData: null, // Será carregado do localStorage
    fallbackResponses: new Map()
};

// Instalação do Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    
    event.waitUntil(
        Promise.all([
            // Cache estático
            caches.open(STATIC_CACHE)
                .then(cache => {
                    console.log('Service Worker: Cache estático criado');
                    return cache.addAll(STATIC_ASSETS);
                }),
            
            // Cache offline
            caches.open(OFFLINE_CACHE)
                .then(cache => {
                    console.log('Service Worker: Cache offline criado');
                    // Adiciona respostas offline básicas
                    return Promise.all([
                        cache.put('/offline-weather', new Response(JSON.stringify(OFFLINE_DATA.weather), {
                            headers: { 'Content-Type': 'application/json' }
                        })),
                        cache.put('/offline-fallback', new Response(JSON.stringify({
                            status: 'offline',
                            message: 'Aplicação funcionando em modo offline',
                            timestamp: new Date().toISOString()
                        }), {
                            headers: { 'Content-Type': 'application/json' }
                        }))
                    ]);
                })
        ])
        .then(() => {
            console.log('Service Worker: Todos os caches criados');
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
                        // Remove caches antigos, mantém apenas os atuais
                        if (![STATIC_CACHE, DYNAMIC_CACHE, ANALYTICS_CACHE, OFFLINE_CACHE].includes(cacheName)) {
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
    
    // Ignora requisições não-GET
    if (request.method !== 'GET') {
        return;
    }
    
    // Cache First para recursos estáticos
    if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }
    
    // Estratégia especial para APIs de clima
    if (request.url.includes('api.open-meteo.com')) {
        event.respondWith(weatherApiStrategy(request));
        return;
    }
    
    // Network First para outras APIs externas
    if (EXTERNAL_APIS.some(api => request.url.includes(api))) {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
        return;
    }
    
    // Estratégia offline para requisições locais
    if (url.origin === self.location.origin) {
        event.respondWith(offlineFirstStrategy(request));
        return;
    }
    
    // Network Only para outras requisições
    event.respondWith(fetch(request).catch(() => {
        return caches.match('/offline-fallback');
    }));
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

// Estratégia especial para API de clima
async function weatherApiStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
        
    } catch (error) {
        console.warn('API de clima falhou, usando dados offline:', error);
        
        // Tenta cache primeiro
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback para dados offline
        const offlineCache = await caches.open(OFFLINE_CACHE);
        return offlineCache.match('/offline-weather');
    }
}

// Estratégia offline first para requisições locais
async function offlineFirstStrategy(request) {
    try {
        // Verifica cache primeiro
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // Atualiza em background se possível
            updateCache(request, cache);
            return cachedResponse;
        }
        
        // Tenta rede se não estiver em cache
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.warn('Estratégia offline falhou:', error);
        
        // Fallback final
        const offlineCache = await caches.open(OFFLINE_CACHE);
        return offlineCache.match('/offline-fallback');
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