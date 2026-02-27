"use client";

import { useState, useEffect, useCallback } from "react";

type OfflineMapStatus = "idle" | "checking" | "downloading" | "ready" | "error";

type OfflineMapState = {
  status: OfflineMapStatus;
  progress: number;
  cachedTiles: number;
  totalTiles: number;
  error: string | null;
};

// Generate tile URLs for a bounding box at multiple zoom levels
function generateTileUrls(
  bounds: { north: number; south: number; east: number; west: number },
  minZoom: number = 10,
  maxZoom: number = 15
): string[] {
  const tiles: string[] = [];
  const tileServer = "https://a.basemaps.cartocdn.com/dark_all";

  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const n = Math.pow(2, zoom);

    // Convert lat/lng to tile coordinates
    const minX = Math.floor(((bounds.west + 180) / 360) * n);
    const maxX = Math.floor(((bounds.east + 180) / 360) * n);
    const minY = Math.floor(
      ((1 -
        Math.log(
          Math.tan((bounds.north * Math.PI) / 180) +
            1 / Math.cos((bounds.north * Math.PI) / 180)
        ) /
          Math.PI) /
        2) *
        n
    );
    const maxY = Math.floor(
      ((1 -
        Math.log(
          Math.tan((bounds.south * Math.PI) / 180) +
            1 / Math.cos((bounds.south * Math.PI) / 180)
        ) /
          Math.PI) /
        2) *
        n
    );

    // Generate tile URLs
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        // Normalize x to handle world wrap
        const normalizedX = ((x % n) + n) % n;
        tiles.push(`${tileServer}/${zoom}/${normalizedX}/${y}.png`);
      }
    }
  }

  // Also add Leaflet marker icons
  tiles.push(
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
  );

  return tiles;
}

// Calculate bounds from center point with a radius
function calculateBounds(
  lat: number,
  lng: number,
  radiusKm: number = 20
): { north: number; south: number; east: number; west: number } {
  // Approximate degrees per km
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}

export function useOfflineMap(
  centerLat?: number,
  centerLng?: number,
  autoCache: boolean = true
) {
  const [state, setState] = useState<OfflineMapState>({
    status: "idle",
    progress: 0,
    cachedTiles: 0,
    totalTiles: 0,
    error: null,
  });

  // Listen for service worker messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "CACHE_PROGRESS") {
        setState((prev) => ({
          ...prev,
          status: "downloading",
          progress: Math.round((event.data.cached / event.data.total) * 100),
          cachedTiles: event.data.cached,
          totalTiles: event.data.total,
        }));
      } else if (event.data.type === "CACHE_COMPLETE") {
        setState((prev) => ({
          ...prev,
          status: "ready",
          progress: 100,
          cachedTiles: event.data.cached,
          totalTiles: event.data.total,
        }));
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  const startCaching = useCallback(
    async (lat?: number, lng?: number) => {
      const targetLat = lat ?? centerLat;
      const targetLng = lng ?? centerLng;

      if (targetLat === undefined || targetLng === undefined) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "No coordinates provided for caching",
        }));
        return;
      }

      if (!("serviceWorker" in navigator)) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "Service workers not supported",
        }));
        return;
      }

      setState({
        status: "checking",
        progress: 0,
        cachedTiles: 0,
        totalTiles: 0,
        error: null,
      });

      try {
        const registration = await navigator.serviceWorker.ready;
        const bounds = calculateBounds(targetLat, targetLng, 25); // 25km radius
        const tiles = generateTileUrls(bounds, 10, 14); // Zoom levels 10-14

        setState((prev) => ({
          ...prev,
          status: "downloading",
          totalTiles: tiles.length,
        }));

        // Send tiles to service worker for caching
        registration.active?.postMessage({
          type: "CACHE_MAP_TILES",
          tiles,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : "Failed to cache map",
        }));
      }
    },
    [centerLat, centerLng]
  );

  // Auto-cache when coordinates are available
  useEffect(() => {
    if (
      autoCache &&
      centerLat !== undefined &&
      centerLng !== undefined &&
      state.status === "idle"
    ) {
      // Delay to avoid caching on every coordinate change
      const timeout = setTimeout(() => {
        startCaching();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [autoCache, centerLat, centerLng, state.status, startCaching]);

  return {
    ...state,
    startCaching,
    isOfflineReady: state.status === "ready",
    isDownloading: state.status === "downloading",
  };
}
