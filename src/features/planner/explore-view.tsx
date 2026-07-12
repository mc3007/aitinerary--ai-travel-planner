import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Search,
  Loader2,
  MapPin,
  Eye,
  EyeOff,
  Plus,
  X,
  Compass,
  UtensilsCrossed,
  Landmark,
  Camera,
  ShoppingBag,
  TreePine,
  Hotel,
  Navigation,
  Globe,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LocationAutocomplete } from '../../components/ui/autocomplete';
import type { GeoLocation } from '../../lib/geocoding';

// Overpass API query types
type PoiCategory = 'attraction' | 'restaurant' | 'museum' | 'photo_spot' | 'shopping' | 'park' | 'accommodation';

interface PoiEntry {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: PoiCategory;
  description: string;
  rating?: number;
  website?: string;
  openingHours?: string;
  address?: string;
  selected: boolean;
}

const CATEGORY_CONFIG: Record<PoiCategory, {
  label: string;
  icon: React.ReactNode;
  color: string;
  emoji: string;
  overpassQuery: string;
}> = {
  attraction: {
    label: 'Attractions',
    icon: <Compass className="h-3.5 w-3.5" />,
    color: '#f59e0b',
    emoji: '🏛️',
    overpassQuery: '["tourism"="attraction"]',
  },
  restaurant: {
    label: 'Restaurants',
    icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
    color: '#ef4444',
    emoji: '🍽️',
    overpassQuery: '["amenity"="restaurant"]',
  },
  museum: {
    label: 'Museums',
    icon: <Landmark className="h-3.5 w-3.5" />,
    color: '#8b5cf6',
    emoji: '🏛️',
    overpassQuery: '["tourism"="museum"]',
  },
  photo_spot: {
    label: 'Photo Spots',
    icon: <Camera className="h-3.5 w-3.5" />,
    color: '#06b6d4',
    emoji: '📸',
    overpassQuery: '["tourism"="viewpoint"]',
  },
  shopping: {
    label: 'Shopping',
    icon: <ShoppingBag className="h-3.5 w-3.5" />,
    color: '#ec4899',
    emoji: '🛍️',
    overpassQuery: '["shop"="mall"]',
  },
  park: {
    label: 'Parks & Nature',
    icon: <TreePine className="h-3.5 w-3.5" />,
    color: '#22c55e',
    emoji: '🌳',
    overpassQuery: '["leisure"="park"]',
  },
  accommodation: {
    label: 'Hotels',
    icon: <Hotel className="h-3.5 w-3.5" />,
    color: '#3b82f6',
    emoji: '🏨',
    overpassQuery: '["tourism"="hotel"]',
  },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG) as PoiCategory[];

interface ExploreViewProps {
  destination?: string;
  /** Called when user wants to add a POI to their itinerary */
  onAddPoi?: (poi: PoiEntry) => void;
  /** Center coordinates if known */
  centerLat?: number;
  centerLng?: number;
}

/** Fetch the user's approximate location via ip-api.com (free, no key) */
async function detectUserLocation(): Promise<{ lat: number; lng: number; city: string } | null> {
  try {
    const res = await fetch('https://ip-api.com/json/?fields=status,lat,lon,city', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'success') {
      return { lat: data.lat, lng: data.lon, city: data.city || 'Your Location' };
    }
    return null;
  } catch {
    return null;
  }
}

export function ExploreView({ destination, onAddPoi, centerLat, centerLng }: ExploreViewProps) {
  const [pois, setPois] = useState<PoiEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoi, setSelectedPoi] = useState<PoiEntry | null>(null);
  const [activeCategories, setActiveCategories] = useState<PoiCategory[]>(ALL_CATEGORIES);
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number } | null>(
    centerLat && centerLng ? { lat: centerLat, lng: centerLng } : null
  );
  const [currentDestination, setCurrentDestination] = useState(destination || '');
  const [hasAutoLocated, setHasAutoLocated] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Auto-detect user location on mount if no center provided
  useEffect(() => {
    if (currentCenter || hasAutoLocated) return;
    setLocationLoading(true);
    detectUserLocation().then((loc) => {
      if (loc) {
        setCurrentCenter({ lat: loc.lat, lng: loc.lng });
        setCurrentDestination(loc.city || 'Your Location');
      }
      setHasAutoLocated(true);
      setLocationLoading(false);
    });
  }, [currentCenter, hasAutoLocated]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !currentCenter) return;

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
        layers: [{
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
        }],
      },
      center: [currentCenter.lng, currentCenter.lat],
      zoom: 13,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('click', () => setSelectedPoi(null));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, [currentCenter]);

  // Fetch POIs from Overpass API
  const fetchPois = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError('');

    const categoryFilters = activeCategories
      .map((cat) => CATEGORY_CONFIG[cat].overpassQuery)
      .join('\n');

    const query = `
      [out:json][timeout:25];
      (
        node${categoryFilters}(around:2000,${lat},${lng});
        way${categoryFilters}(around:2000,${lat},${lng});
      );
      out center 50;
    `;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) throw new Error('Failed to fetch places');

      const data = await response.json();

      const results: PoiEntry[] = (data.elements || [])
        .filter((el: any) => el.tags?.name)
        .map((el: any) => {
          const lat2 = el.lat || el.center?.lat || lat;
          const lng2 = el.lon || el.center?.lon || lng;
          const tags = el.tags || {};

          let category: PoiCategory = 'attraction';
          if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food') category = 'restaurant';
          else if (tags.tourism === 'museum' || tags.amenity === 'arts_centre') category = 'museum';
          else if (tags.tourism === 'viewpoint' || tags.information === 'viewpoint') category = 'photo_spot';
          else if (tags.shop || tags.amenity === 'marketplace') category = 'shopping';
          else if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.natural) category = 'park';
          else if (tags.tourism === 'hotel' || tags.tourism === 'hostel' || tags.tourism === 'guest_house') category = 'accommodation';

          return {
            id: `${el.type}-${el.id}`,
            name: tags.name,
            lat: lat2,
            lng: lng2,
            category,
            description: tags.description || tags.cuisine || tags.tourism || tags.leisure || '',
            rating: tags.rating ? parseFloat(tags.rating) : undefined,
            website: tags.website || tags.facebook || undefined,
            openingHours: tags.opening_hours || undefined,
            address: tags['addr:street']
              ? `${tags['addr:street']}${tags['addr:housenumber'] ? ` ${tags['addr:housenumber']}` : ''}`
              : undefined,
            selected: false,
          };
        })
        .filter((poi: PoiEntry) => poi.name && poi.lat && poi.lng)
        .slice(0, 50);

      setPois(results);
    } catch {
      setError('Could not load places. Try searching by name.');
      setPois([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategories]);

  // Auto-fetch POIs when center changes
  useEffect(() => {
    if (currentCenter) {
      fetchPois(currentCenter.lat, currentCenter.lng);
    }
  }, [currentCenter, fetchPois]);

  // Handle location select from autocomplete
  const handleLocationSelect = (location: GeoLocation) => {
    setSearchQuery('');
    setCurrentCenter({ lat: location.lat, lng: location.lng });
    setCurrentDestination(location.displayName);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [location.lng, location.lat], zoom: 14 });
    }
  };

  // Plain text fallback search
  const searchFallback = async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
      });
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { 'Accept': 'application/json', 'User-Agent': 'AITinerary/1.0' } }
      );
      const geoData = await geoResponse.json();

      if (geoData.length > 0) {
        const loc = geoData[0];
        const lat = parseFloat(loc.lat);
        const lng = parseFloat(loc.lon);
        setCurrentCenter({ lat, lng });
        setCurrentDestination(loc.display_name || query);
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
        }
      } else {
        setError('Location not found. Try a different search.');
      }
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update markers on map when POIs change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pois.forEach((poi) => {
      const config = CATEGORY_CONFIG[poi.category];
      const color = config.color;

      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px;
          background: ${poi.selected ? '#10b981' : color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
          font-size: 14px;
          transition: transform 0.15s ease;
        ">
          ${config.emoji}
        </div>
      `;

      el.addEventListener('click', () => setSelectedPoi(poi));
      el.addEventListener('mouseenter', () => {
        el.firstElementChild?.setAttribute('style', `display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: ${poi.selected ? '#10b981' : color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.35); cursor: pointer; font-size: 14px; transform: scale(1.1)`);
      });
      el.addEventListener('mouseleave', () => {
        el.firstElementChild?.setAttribute('style', `display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: ${poi.selected ? '#10b981' : color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.25); cursor: pointer; font-size: 14px;`);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [pois, searchQuery]);

  const toggleCategory = (cat: PoiCategory) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    if (currentCenter) fetchPois(currentCenter.lat, currentCenter.lng);
  };

  const handleAddPoi = (poi: PoiEntry) => {
    setPois((prev) =>
      prev.map((p) => (p.id === poi.id ? { ...p, selected: true } : p))
    );
    onAddPoi?.(poi);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-border/50 bg-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {currentDestination ? `Explore: ${currentDestination}` : 'Explore Destinations'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {loading ? 'Loading...' : `${pois.length} places`}
          </span>
          {onAddPoi && selectedPoi && (
            <Button
              size="sm"
              variant="default"
              className="h-7 gap-1 text-xs"
              onClick={() => handleAddPoi(selectedPoi)}
              disabled={selectedPoi.selected}
            >
              <Plus className="h-3 w-3" />
              {selectedPoi.selected ? 'Added' : 'Add to Trip'}
            </Button>
          )}
        </div>
      </div>

      {/* Search & Category filters */}
      <div className="border-b border-border/50 px-3 py-2">
        <div className="relative mb-2">
          <LocationAutocomplete
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            onSelect={handleLocationSelect}
            placeholder="Search for a city or destination..."
            className="flex-1"
          />
          {currentCenter && (
            <button
              onClick={async () => {
                setLocationLoading(true);
                const loc = await detectUserLocation();
                if (loc) {
                  setCurrentCenter({ lat: loc.lat, lng: loc.lng });
                  setCurrentDestination(loc.city || 'Your Location');
                  if (mapRef.current) {
                    mapRef.current.flyTo({ center: [loc.lng, loc.lat], zoom: 13 });
                  }
                }
                setLocationLoading(false);
              }}
              disabled={locationLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Go to my location"
            >
              {locationLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const isActive = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'border border-border/50 text-muted-foreground hover:text-foreground'
                }`}
                style={{ backgroundColor: isActive ? cat === 'accommodation' ? config.color + 'dd' : config.color : 'transparent' }}
              >
                {isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {config.emoji} {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map + Side Panel */}
      <div className="flex flex-1">
        {/* Map area */}
        <div className="relative flex-1">
          <div ref={mapContainerRef} className="h-full w-full" />

          {!currentCenter && !locationLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
              <div className="text-center">
                <Globe className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Searching for your location...
                </p>
              </div>
            </div>
          )}

          {locationLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Detecting your location...
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute right-3 top-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 right-3 rounded-lg border border-border/50 bg-card/90 px-2.5 py-1.5 text-[10px] backdrop-blur-sm">
            <p className="mb-1 font-medium text-foreground">Legend</p>
            <div className="space-y-0.5">
              {ALL_CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <div key={cat} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span className="text-muted-foreground">{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* POI Detail Panel */}
        <AnimatePresence>
          {selectedPoi && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden border-l border-border/50 sm:block"
            >
              <div className="h-full overflow-y-auto p-4">
                <div className="mb-3 flex items-start justify-between">
                  <Badge
                    variant="outline"
                    className="text-[10px]"
                    style={{
                      borderColor: CATEGORY_CONFIG[selectedPoi.category].color,
                      color: CATEGORY_CONFIG[selectedPoi.category].color,
                    }}
                  >
                    {CATEGORY_CONFIG[selectedPoi.category].emoji}{' '}
                    {CATEGORY_CONFIG[selectedPoi.category].label}
                  </Badge>
                  <button
                    onClick={() => setSelectedPoi(null)}
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <h4 className="mb-1 text-base font-bold text-foreground">
                  {selectedPoi.name}
                </h4>

                {selectedPoi.description && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {selectedPoi.description}
                  </p>
                )}

                {selectedPoi.address && (
                  <div className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{selectedPoi.address}</span>
                  </div>
                )}

                {selectedPoi.openingHours && (
                  <div className="mb-3 rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-[10px] font-medium text-foreground">Hours</p>
                    <p className="text-xs text-muted-foreground">{selectedPoi.openingHours}</p>
                  </div>
                )}

                {selectedPoi.rating && (
                  <div className="mb-3 flex items-center gap-1 text-xs">
                    <span className="text-amber-500">★</span>
                    <span className="font-medium text-foreground">{selectedPoi.rating.toFixed(1)}</span>
                  </div>
                )}

                {onAddPoi && (
                  <Button
                    className="mt-4 w-full gap-2"
                    size="sm"
                    onClick={() => handleAddPoi(selectedPoi)}
                    disabled={selectedPoi.selected}
                  >
                    {selectedPoi.selected ? (
                      <>✓ Added to Trip</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add to Itinerary
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* POI list below map on mobile */}
      <div className="flex gap-1 overflow-x-auto border-t border-border/50 px-3 py-2 sm:hidden">
        {pois.slice(0, 10).map((poi) => (
          <button
            key={poi.id}
            onClick={() => setSelectedPoi(poi)}
            className="shrink-0 cursor-pointer rounded-lg border border-border/50 px-3 py-2 text-left text-xs transition-colors hover:border-primary/50"
          >
            <span className="mr-1">{CATEGORY_CONFIG[poi.category].emoji}</span>
            <span className="font-medium text-foreground">{poi.name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}