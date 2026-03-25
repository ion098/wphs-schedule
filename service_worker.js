/**
 * Adds multiple resources to the service worker cache.
 * @param {Array<RequestInfo>} resources The resources to be cached
 */
const add_resources_to_cache = async (resources) => {
    const cache = await caches.open('v1');
    await cache.addAll(resources);
};

/**
 * Adds a request/response pair to the service worker cache.
 * @param {RequestInfo} request The request to be cached
 * @param {Response} response The response to be cached
 */
const put_in_cache = async (request, response) => {
    const cache = await caches.open('v1');
    await cache.put(request, response);
};

const fetch_from_cache = async (request) => {
    const response_from_cache = await caches.match(request.clone());
    if (response_from_cache) {
        return response_from_cache;
    } else {
        throw new Error("Request not found in cache");
    }
};

const fetch_from_network = async (request) => {
    const response_from_network = await fetch(request.clone());
    put_in_cache(request, response_from_network.clone());
    return response_from_network;
};

const cache_first = async (request) => {
    try {
        return await Promise.any([fetch_from_cache(request), fetch_from_network(request)]);
    } catch (error) {
        return new Response('Offline and not in cache', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
};

self.addEventListener('install', (event) => {
    event.waitUntil(
        add_resources_to_cache([
            './',
            './index.html',
            './style/pico.trimmed.min.css',
            './main.js',
        ])
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(cache_first(event.request));
});