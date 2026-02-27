"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Download, CheckCircle, WifiOff, CloudOff } from "lucide-react";
import { useGeocode } from "@/lib/useGeocode";
import { useOfflineMap } from "@/lib/useOfflineMap";

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

const selectedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  tooltipAnchor: [16, -34],
  shadowSize: [49, 49],
  className: "selected-marker",
});

L.Marker.prototype.options.icon = defaultIcon;

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 12);
  }, [center, map]);
  return null;
}

function MapPanner({
  target,
}: {
  target: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 14, { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

export type MapMarker = {
  lat: number;
  lng: number;
  label: string;
  id?: string;
};

function OfflineIndicator({
  status,
  progress,
  cachedTiles,
  totalTiles,
}: {
  status: string;
  progress: number;
  cachedTiles: number;
  totalTiles: number;
}) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (status === "idle" || status === "checking") {
    return null;
  }

  if (status === "downloading") {
    return (
      <div className="absolute top-3 right-3 z-[1000] bg-indigo-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
        <Download className="w-4 h-4 animate-pulse" />
        <div className="flex flex-col">
          <span className="font-medium">Downloading for offline...</span>
          <span className="text-xs opacity-80">
            {cachedTiles} / {totalTiles} tiles ({progress}%)
          </span>
        </div>
      </div>
    );
  }

  if (status === "ready") {
    if (!isOnline) {
      return (
        <div className="absolute top-3 right-3 z-[1000] bg-amber-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="font-medium">Offline Mode</span>
        </div>
      );
    }
    return (
      <div className="absolute top-3 right-3 z-[1000] bg-emerald-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 opacity-90">
        <CheckCircle className="w-4 h-4" />
        <span className="font-medium">Available offline</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="absolute top-3 right-3 z-[1000] bg-red-600/90 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
        <CloudOff className="w-4 h-4" />
        <span className="font-medium">Offline cache failed</span>
      </div>
    );
  }

  return null;
}

export default function InteractiveMap({
  destination,
  markers = [],
  selectedMarkerId,
  onMarkerClick,
}: {
  destination: string;
  markers?: MapMarker[];
  selectedMarkerId?: string | null;
  onMarkerClick?: (id: string | null) => void;
}) {
  const { coords, loading: geoLoading } = useGeocode(destination);

  const center = useMemo<[number, number] | null>(() => {
    if (!coords) return null;
    return [coords.latitude, coords.longitude];
  }, [coords]);

  // Offline map caching
  const offlineMap = useOfflineMap(
    coords?.latitude,
    coords?.longitude,
    true // Auto-cache when coordinates are available
  );

  // If we have markers with valid coordinates, fit the map to them
  const validMarkers = markers.filter((m) => m.lat && m.lng);

  // Find the selected marker to fly to
  const selectedTarget = useMemo<[number, number] | null>(() => {
    if (!selectedMarkerId) return null;
    const marker = validMarkers.find((m) => m.id === selectedMarkerId);
    if (!marker) return null;
    return [marker.lat, marker.lng];
  }, [selectedMarkerId, validMarkers]);

  if (geoLoading) {
    return (
      <div className="h-[500px] w-full bg-muted flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="h-[500px] w-full bg-muted flex flex-col items-center justify-center">
        <p className="text-muted-foreground">
          Map unavailable for this destination.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full relative z-0">
      {/* Offline Status Indicator */}
      <OfflineIndicator
        status={offlineMap.status}
        progress={offlineMap.progress}
        cachedTiles={offlineMap.cachedTiles}
        totalTiles={offlineMap.totalTiles}
      />

      <MapContainer
        center={center}
        zoom={validMarkers.length > 1 ? 10 : 12}
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {/* Always show the destination marker */}
        <Marker position={center}>
          <Popup>
            <span className="font-semibold">{destination}</span>
          </Popup>
        </Marker>
        {/* Plot itinerary item markers */}
        {validMarkers.map((marker, idx) => (
          <Marker
            key={marker.id || idx}
            position={[marker.lat, marker.lng]}
            icon={
              marker.id && marker.id === selectedMarkerId
                ? selectedIcon
                : defaultIcon
            }
            eventHandlers={{
              click: () => {
                if (marker.id && onMarkerClick) {
                  onMarkerClick(
                    marker.id === selectedMarkerId ? null : marker.id,
                  );
                }
              },
            }}
          >
            <Popup>
              <span className="font-semibold">{marker.label}</span>
            </Popup>
          </Marker>
        ))}
        <MapUpdater center={center} />
        <MapPanner target={selectedTarget} />
      </MapContainer>
    </div>
  );
}
