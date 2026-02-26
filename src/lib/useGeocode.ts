"use client";

import { useEffect, useState } from "react";

type GeoResult = {
  latitude: number;
  longitude: number;
} | null;

// Simple in-memory cache to avoid re-fetching for the same destination
const geocodeCache = new Map<string, GeoResult>();

export function useGeocode(destination: string) {
  const [coords, setCoords] = useState<GeoResult>(
    geocodeCache.get(destination) ?? null,
  );
  const [loading, setLoading] = useState(!geocodeCache.has(destination));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destination) {
      setLoading(false);
      return;
    }

    // Return cached result immediately
    if (geocodeCache.has(destination)) {
      setCoords(geocodeCache.get(destination)!);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchCoords() {
      try {
        setLoading(true);
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            destination,
          )}&count=1&language=en&format=json`,
        );
        const geoData = await geoRes.json();

        if (cancelled) return;

        if (geoData.results && geoData.results.length > 0) {
          const result = {
            latitude: geoData.results[0].latitude,
            longitude: geoData.results[0].longitude,
          };
          geocodeCache.set(destination, result);
          setCoords(result);
        } else {
          geocodeCache.set(destination, null);
          setError("Location not found");
        }
      } catch {
        if (!cancelled) setError("Could not geocode location");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCoords();
    return () => {
      cancelled = true;
    };
  }, [destination]);

  return { coords, loading, error };
}
