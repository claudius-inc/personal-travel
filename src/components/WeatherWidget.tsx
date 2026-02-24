"use client";

import { useEffect, useState } from "react";
import { Loader2, Cloud, Sun, CloudRain, Snowflake } from "lucide-react";

type WeatherData = {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
};

export function WeatherWidget({ destination }: { destination: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        // Step 1: Geocode the destination
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            destination,
          )}&count=1&language=en&format=json`,
        );
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          setError("Location not found");
          setLoading(false);
          return;
        }

        const { latitude, longitude } = geoData.results[0];

        // Step 2: Fetch weather from our API
        const weatherRes = await fetch(
          `/api/weather?lat=${latitude}&lng=${longitude}`,
        );
        if (!weatherRes.ok) throw new Error("Failed to fetch weather");

        const weatherData = await weatherRes.json();
        setWeather(weatherData);
      } catch (err) {
        setError("Could not load weather");
      } finally {
        setLoading(false);
      }
    }

    if (destination) {
      fetchWeather();
    }
  }, [destination]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-neutral-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Fetching weather...
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="text-neutral-500 text-sm text-right mt-1">{error}</div>
    );
  }

  // Get current day's weather (first index)
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

  return (
    <div className="flex items-center gap-3 text-right">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-neutral-200">
          H: {Math.round(maxTemp)}° L: {Math.round(minTemp)}°
        </span>
        <span className="text-xs text-neutral-400">7-Day Forecast Avail</span>
      </div>
      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
        <WeatherIcon className="w-5 h-5 text-indigo-400" />
      </div>
    </div>
  );
}
