import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion } from 'framer-motion';
import type { ItineraryResponse } from '../../types/itinerary';

interface MapViewProps {
  itinerary: ItineraryResponse | null;
  destination: string;
}

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

const TRANSPORT_DASH: Record<string, number[]> = {
  flight: [8, 8],
  ferry: [4, 4],
};

/**
 * Create a DOM-based HTML marker for MapLibre.
 * Returns a maplibregl.Marker with a styled pill label.
 */
function createPillMarker(lat: number, lng: number, label: string, color: string, dayInfo?: string) {
  const el = document.createElement('div');

  const emojiMap: Record<string, string> = {
    morning: '🌅', afternoon: '☀️', evening: '🌙',
  };
  const dayEmoji = dayInfo ? emojiMap[dayInfo as keyof typeof emojiMap] || '📌' : '📌';

  el.innerHTML = `
    <div style="
      display: flex; align-items: center; gap: 6px;
      padding: 6px 10px;
      background: ${color};
      border: 2px solid white;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      font-size: 12px; font-weight: 600;
      color: white; white-space: nowrap;
      cursor: pointer;
      transition: transform 0.15s ease;
      transform: scale(1);
    ">
      <span>${dayEmoji}</span>
      <span>${label || '📍'}</span>
    </div>
  `;

  el.addEventListener('mouseenter', () => {
    const inner = el.firstElementChild as HTMLElement;
    if (inner) inner.style.transform = 'scale(1.08)';
  });
  el.addEventListener('mouseleave', () => {
    const inner = el.firstElementChild as HTMLElement;
    if (inner) inner.style.transform = 'scale(1)';
  });

  return new maplibregl.Marker({ element: el, anchor: 'center' })
    .setLngLat([lng, lat]);
}

export function MapView({ itinerary, destination }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const geoJsonSourceId = 'route-lines';
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [0, 20],
      zoom: 2,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      map.addSource(geoJsonSourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'route-lines-layer',
        type: 'line',
        source: geoJsonSourceId,
        paint: {
          'line-width': 3,
          'line-opacity': 0.7,
          'line-color': '#6C63FF',
        },
      });

      map.scrollZoom.enable();
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // Update markers and routes when itinerary changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !itinerary?.days) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const allActivities = itinerary.days.flatMap((d) => d.activities);
    const validLocations = allActivities.filter(
      (a) => a.location?.lat && a.location?.lng && a.location.lat !== 0 && a.location.lng !== 0
    );

    const markers: maplibregl.Marker[] = [];
    const bounds = new maplibregl.LngLatBounds();

    // Fallback to top-level destination locations if no activity coordinates are available
    if (validLocations.length === 0 && itinerary.locations && itinerary.locations.length > 0) {
      itinerary.locations.forEach((loc) => {
        if (loc.lat && loc.lng && loc.lat !== 0 && loc.lng !== 0) {
          const marker = createPillMarker(loc.lat, loc.lng, loc.name, '#6C63FF');
          marker.addTo(map);
          markers.push(marker);
          bounds.extend([loc.lng, loc.lat]);
        }
      });

      if (markers.length > 0) {
        markersRef.current = markers;
        const pad = Math.max(bounds.getNorth() - bounds.getSouth(), bounds.getEast() - bounds.getWest()) * 0.15 || 0.2;
        if (bounds.getNorth() !== bounds.getSouth() || bounds.getEast() !== bounds.getWest()) {
          map.fitBounds(bounds, { padding: 40, maxZoom: 12 });
        } else if (markers[0]) {
          map.flyTo({ center: [markers[0].getLngLat().lng, markers[0].getLngLat().lat], zoom: 12 });
        }
        return;
      }
    }

    if (validLocations.length === 0) {
      return;
    }


    // Add activity markers
    validLocations.forEach((act) => {
      const marker = createPillMarker(
        act.location.lat,
        act.location.lng,
        act.title.slice(0, 25),
        act.visited ? '#10b981' : '#6C63FF',
        act.category
      );
      marker.addTo(map);
      markers.push(marker);
      bounds.extend([act.location.lng, act.location.lat]);
    });

    // Build route GeoJSON features
    const routeFeatures: GeoJSON.Feature[] = [];

    // Day-specific routes
    itinerary.days.forEach((day) => {
      if (day.route) {
        const fromAct = validLocations.find((a) => a.location.name === day.route!.from);
        const toAct = validLocations.find((a) => a.location.name === day.route!.to);
        if (fromAct && toAct) {
          const color = TRANSPORT_COLORS[day.route.transportMode] ?? '#6C63FF';
          const dash = TRANSPORT_DASH[day.route.transportMode];
          routeFeatures.push({
            type: 'Feature',
            properties: {
              color,
              dash: dash ? dash.join(',') : undefined,
              label: `${day.route.from} → ${day.route.to}`,
              mode: day.route.transportMode,
              distance: day.route.estimatedDistanceKm,
              duration: day.route.estimatedDuration,
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [fromAct.location.lng, fromAct.location.lat],
                [toAct.location.lng, toAct.location.lat],
              ],
            },
          });
        }
      }
    });

    // If no specific routes, draw sequential connecting lines
    if (routeFeatures.length === 0 && validLocations.length > 1) {
      const coords = validLocations.map((a) => [a.location.lng, a.location.lat]);
      routeFeatures.push({
        type: 'Feature',
        properties: { color: '#6C63FF', label: 'Route' },
        geometry: { type: 'LineString', coordinates: coords },
      });
    }

    // Also add explicit routes from itinerary
    if (itinerary.routes?.length) {
      itinerary.routes.forEach((route) => {
        const fromAct = validLocations.find((a) => a.location.name === route.from);
        const toAct = validLocations.find((a) => a.location.name === route.to);
        if (fromAct && toAct) {
          const color = TRANSPORT_COLORS[route.transportMode] ?? '#6C63FF';
          const dash = TRANSPORT_DASH[route.transportMode];
          routeFeatures.push({
            type: 'Feature',
            properties: { color, dash: dash ? dash.join(',') : undefined, label: `${route.from} → ${route.to}` },
            geometry: {
              type: 'LineString',
              coordinates: [
                [fromAct.location.lng, fromAct.location.lat],
                [toAct.location.lng, toAct.location.lat],
              ],
            },
          });
        }
      });
    }

    // Update route layer if source is loaded
    if (map.getSource(geoJsonSourceId)) {
      const source = map.getSource(geoJsonSourceId) as maplibregl.GeoJSONSource;
      source.setData({ type: 'FeatureCollection', features: routeFeatures });

      // Color individual routes - since we can't easily style per-feature in one layer,
      // just set a single nice color
      map.setPaintProperty('route-lines-layer', 'line-color', '#6C63FF');
    }

    markersRef.current = markers;
    const pad = Math.max(bounds.getNorth() - bounds.getSouth(), bounds.getEast() - bounds.getWest()) * 0.15 || 0.2;
    if (bounds.getNorth() !== bounds.getSouth() || bounds.getEast() !== bounds.getWest()) {
      map.fitBounds(bounds, { padding: 40, maxZoom: 14 });
    }
  }, [itinerary, mapLoaded]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="overflow-hidden rounded-xl border border-border/50"
    >
      <div className="flex items-center justify-between border-b border-border/50 bg-card px-4 py-2">
        <h3 className="text-sm font-semibold text-foreground">
          {destination || 'Interactive Map'}
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#10b981]" /> Visited
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#6C63FF]" /> Planned
            </span>
          </div>
          <span className="text-xs text-muted-foreground">OpenStreetMap</span>
        </div>
      </div>
      <div
        ref={mapContainerRef}
        className="h-[450px] w-full"
      />
    </motion.div>
  );
}