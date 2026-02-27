/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Custom cache for map tiles with offline-first strategy
const mapTileCache: RuntimeCaching = {
  matcher: ({ url }) => {
    // Match map tile URLs from common providers
    return (
      url.hostname.includes("basemaps.cartocdn.com") ||
      url.hostname.includes("tile.openstreetmap.org") ||
      url.hostname.includes("tiles.stadiamaps.com") ||
      url.hostname.includes("api.mapbox.com") ||
      url.hostname.includes("unpkg.com") // For Leaflet marker icons
    );
  },
  handler: "CacheFirst",
  options: {
    cacheName: "map-tiles-cache",
    expiration: {
      maxEntries: 5000, // Store up to 5000 tiles
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
    },
    cacheableResponse: {
      statuses: [0, 200],
    },
  },
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [mapTileCache, ...defaultCache],
});

serwist.addEventListeners();

// Handle custom messages for offline map pre-caching
self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "CACHE_MAP_TILES") {
    const { tiles } = event.data;
    const cache = await caches.open("map-tiles-cache");
    
    let cached = 0;
    let failed = 0;
    
    for (const tileUrl of tiles) {
      try {
        // Check if already cached
        const existing = await cache.match(tileUrl);
        if (!existing) {
          const response = await fetch(tileUrl);
          if (response.ok) {
            await cache.put(tileUrl, response);
            cached++;
          } else {
            failed++;
          }
        }
      } catch {
        failed++;
      }
      
      // Report progress
      if (event.source) {
        (event.source as Client).postMessage({
          type: "CACHE_PROGRESS",
          cached,
          failed,
          total: tiles.length,
        });
      }
    }
    
    // Report completion
    if (event.source) {
      (event.source as Client).postMessage({
        type: "CACHE_COMPLETE",
        cached,
        failed,
        total: tiles.length,
      });
    }
  }
});
