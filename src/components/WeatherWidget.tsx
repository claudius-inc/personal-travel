"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, Cloud, Sun, CloudRain, Snowflake } from "lucide-react";
import { useGeocode } from "@/lib/useGeocode";

type WeatherData = {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
};

export function WeatherWidget({ destination }: { destination: string }) {
  const {
    coords,
    loading: geoLoading,
    error: geoError,
  } = useGeocode(destination);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [fetchState, setFetchState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: true, error: null });

  useEffect(() => {
    if (geoLoading) return;
    if (geoError || !coords) {
      setFetchState({
        loading: false,
        error: geoError || "Location not found",
      });
      return;
    }

    let cancelled = false;

    async function fetchWeather() {
      try {
        setFetchState({ loading: true, error: null });
        const weatherRes = await fetch(
          `/api/weather?lat=${coords!.latitude}&lng=${coords!.longitude}`,
        );
        if (!weatherRes.ok) throw new Error("Failed to fetch weather");

        const weatherData = await weatherRes.json();
        if (!cancelled) {
          setWeather(weatherData);
          setFetchState({ loading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setFetchState({ loading: false, error: "Could not load weather" });
        }
      }
    }

    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, [coords, geoLoading, geoError]);

  const isLoading = fetchState.loading || geoLoading;
  const error = fetchState.error;

  const weatherInfo = useMemo(() => {
    if (!weather) return null;
    const maxTemp = weather.daily.temperature_2m_max[0];
    const minTemp = weather.daily.temperature_2m_min[0];
    const code = weather.daily.weather_code[0];

    let WeatherIcon = Cloud;
    if (code === 0) WeatherIcon = Sun;
    else if (code >= 1 && code <= 3) WeatherIcon = Cloud;
    else if (code >= 51 && code <= 67) WeatherIcon = CloudRain;
    else if (code >= 71 && code <= 77) WeatherIcon = Snowflake;
    else if (code >= 80 && code <= 82) WeatherIcon = CloudRain;
    else if (code >= 95 && code <= 99) WeatherIcon = CloudRain;

    return { maxTemp, minTemp, WeatherIcon };
  }, [weather]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Fetching weather...
      </div>
    );
  }

  if (error || !weatherInfo) {
    return (
      <div className="text-muted-foreground text-sm text-right mt-1">
        {error}
      </div>
    );
  }

  const { maxTemp, minTemp, WeatherIcon } = weatherInfo;

  return (
    <div className="flex items-center gap-3 text-right">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          H: {Math.round(maxTemp)}° L: {Math.round(minTemp)}°
        </span>
        <span className="text-xs text-muted-foreground">
          7-Day Forecast Avail
        </span>
      </div>
      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shadow-sm">
        <WeatherIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
    </div>
  );
}
