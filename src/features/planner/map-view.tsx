import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import type { ItineraryResponse } from '../../types/itinerary';

// Fix Leaflet icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

interface MapViewProps {
  itinerary: ItineraryResponse | null;
  destination: string;
}

const createIcon = (color: string, label?: string) => {
  const size = label ? 24 : 12;
  const displayLabel = label ?? '';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      display: flex; align-items: center; justify-content: center;
      gap: 4px; padding: 2px 6px;
      background: ${color};
      border: 2px solid white;
      border-radius: 20px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-size: 11px; font-weight: 600;
      color: white; white-space: nowrap;
    ">${displayLabel}</div>`,
    iconSize: [size + displayLabel.length * 6, 28],
    iconAnchor: [(size + displayLabel.length * 6) / 2, 14],
  });
};

const TRANSPORT_COLORS: Record<string, string> = {
  walking: '#22c55e',
  bicycle: '#3b82f6',
  bus: '#f59e0b',
  train: '#8b5cf6',
  car: '#ef4444',
  flight: '#06b6d4',
  ferry: '#0ea5e9',
  rideshare: '#f97316',
};

export function MapView({ itinerary, destination }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !itinerary?.days) return;

    // Clear existing markers and polylines
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const allActivities = itinerary.days.flatMap((d) => d.activities);
    const locations = allActivities
      .filter((a) => a.location?.lat && a.location?.lng)
      .map((a) => a.location);

    if (locations.length > 0) {
      // Add markers with activity names
      const markers = locations.map((loc, i) => {
        const act = allActivities[i];
        return L.marker([loc.lat, loc.lng], {
          icon: createIcon('#6C63FF', act?.title?.slice(0, 20)),
        }).bindPopup(`<b>${act?.title ?? loc.name}</b><br/><small>${act?.description ?? ''}</small>`);
      });

      // Draw route polylines between consecutive markers
      const latlngs = locations
        .filter((loc) => loc.lat !== undefined && loc.lng !== undefined)
        .map((loc) => [loc.lat, loc.lng] as [number, number]);

      if (latlngs.length > 1) {
        // Draw day-specific route legs with different colors if route info exists
        itinerary.days.forEach((day) => {
          if (day.route) {
            const fromLoc = locations.find((l) => l.name === day.route!.from);
            const toLoc = locations.find((l) => l.name === day.route!.to);
            if (fromLoc?.lat && fromLoc?.lng && toLoc?.lat && toLoc?.lng) {
              const routeColor = TRANSPORT_COLORS[day.route.transportMode] ?? '#6C63FF';
              L.polyline(
                [[fromLoc.lat, fromLoc.lng], [toLoc.lat, toLoc.lng]],
                {
                  color: routeColor,
                  weight: 3,
                  opacity: 0.7,
                  dashArray: day.route.transportMode === 'flight' ? '10, 10' : undefined,
                }
              ).addTo(map).bindPopup(`
                <b>${day.route.from} → ${day.route.to}</b><br/>
                <small>${day.route.transportMode} • ${day.route.estimatedDistanceKm} km • ${day.route.estimatedDuration}</small>
              `);
            }
          }
        });

        // If no structured routes exist, draw a simple connecting line
        if (!itinerary.routes?.length) {
          L.polyline(latlngs, {
            color: '#6C63FF',
            weight: 2,
            opacity: 0.4,
          }).addTo(map);
        }
      }

      // Draw any explicit routes from itinerary
      if (itinerary.routes?.length) {
        itinerary.routes.forEach((route) => {
          const fromLoc = locations.find((l) => l.name === route.from);
          const toLoc = locations.find((l) => l.name === route.to);
          if (fromLoc?.lat && fromLoc?.lng && toLoc?.lat && toLoc?.lng) {
            const routeColor = TRANSPORT_COLORS[route.transportMode] ?? '#6C63FF';
            L.polyline(
              [[fromLoc.lat, fromLoc.lng], [toLoc.lat, toLoc.lng]],
              {
                color: routeColor,
                weight: 3,
                opacity: 0.7,
                dashArray: route.transportMode === 'flight' ? '10, 10' : undefined,
              }
            ).addTo(map);
          }
        });
      }

      const group = L.featureGroup(markers);
      map.addLayer(group);
      map.fitBounds(group.getBounds().pad(0.2));
    }
  }, [itinerary]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="overflow-hidden rounded-xl border border-border/50"
    >
      <div className="flex items-center justify-between border-b border-border/50 bg-card px-4 py-2">
        <h3 className="text-sm font-semibold text-foreground">
          {destination || 'Map'}
        </h3>
        <span className="text-xs text-muted-foreground">
          OpenStreetMap
        </span>
      </div>
      <div
        ref={mapContainerRef}
        className="h-[400px] w-full"
      />
    </motion.div>
  );
}