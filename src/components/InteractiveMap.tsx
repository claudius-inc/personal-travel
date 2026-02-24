"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2 } from "lucide-react";

// Fix Leaflet's default icon issue in React
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 12);
  }, [center, map]);
  return null;
}

export default function InteractiveMap({
  destination,
}: {
  destination: string;
}) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoordinates() {
      try {
        setLoading(true);
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            destination,
          )}&count=1&language=en&format=json`,
        );
        const geoData = await geoRes.json();

        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude } = geoData.results[0];
          setCenter([latitude, longitude]);
        }
      } catch (err) {
        console.error("Failed to fetch coordinates for map", err);
      } finally {
        setLoading(false);
      }
    }

    if (destination) {
      fetchCoordinates();
    }
  }, [destination]);

  if (loading) {
    return (
      <div className="h-[500px] w-full bg-neutral-950 flex flex-col items-center justify-center border-b border-neutral-800">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-neutral-400">Loading map...</p>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="h-[500px] w-full bg-neutral-950 flex flex-col items-center justify-center border-b border-neutral-800">
        <p className="text-neutral-400">
          Map unavailable for this destination.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={center}>
          <Popup>
            <span className="font-semibold text-neutral-900">
              {destination}
            </span>
          </Popup>
        </Marker>
        <MapUpdater center={center} />
      </MapContainer>
    </div>
  );
}
