import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bookmark,
  Plus,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  MapPin,
  Globe,
  Trash2,
  Edit3,
  Package,
  Sparkles,
  ChevronRight,
  X,
  FolderPlus,
  Star,
  UtensilsCrossed,
  Hotel,
  Palmtree,
  Mountain,
  Camera,
  ShoppingBag,
  Music,
  Landmark,
  Coffee,
} from 'lucide-react';
import { useSavedPlaces, type SavedPlace, type Collection } from '../../hooks/useSavedPlaces';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';

const PLACE_TYPE_ICONS: Record<string, typeof MapPin> = {
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  hotel: Hotel,
  beach: Palmtree,
  viewpoint: Mountain,
  museum: Landmark,
  park: Mountain,
  shopping: ShoppingBag,
  nightlife: Music,
  city: Globe,
  country: Globe,
  activity: Camera,
};

const PLACE_TYPE_EMOJIS: Record<string, string> = {
  restaurant: '🍽️',
  cafe: '☕',
  hotel: '🏨',
  beach: '🏖️',
  viewpoint: '🌄',
  museum: '🏛️',
  park: '🌳',
  shopping: '🛍️',
  nightlife: '🌙',
  city: '🏙️',
  country: '🌍',
  activity: '🎯',
};

function PlaceCard({ place, onDelete }: { place: SavedPlace; onDelete: (id: string) => void }) {
  const Icon = PLACE_TYPE_ICONS[place.place_type] || MapPin;
  const emoji = PLACE_TYPE_EMOJIS[place.place_type] || '📍';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <Card className="border-border/50 transition-all duration-200 hover:border-primary/20 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-lg">
              {emoji}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground truncate max-w-[180px] sm:max-w-[250px]">
                    {place.name}
                  </h4>
                  <p className="text-xs text-muted-foreground capitalize">
                    {place.place_type} · {place.city || place.country || 'Unknown'}
                  </p>
                </div>
                {place.collections?.name && (
                  <Badge variant="secondary" className="flex-shrink-0 text-[10px]">
                    {place.collections.name}
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {place.tags && place.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {place.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Rating & Price */}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {place.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {place.rating.toFixed(1)}
                  </span>
                )}
                {place.price_level > 0 && (
                  <span>{'💰'.repeat(place.price_level)}</span>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => onDelete(place.id)}
                className="absolute right-2 top-2 cursor-pointer rounded-lg p-1.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                aria-label={`Remove ${place.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CollectionCard({
  collection,
  isActive,
  onClick,
  count,
}: {
  collection: Collection;
  isActive: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full cursor-pointer rounded-xl border p-3 text-left transition-all duration-200',
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/30 hover:bg-muted/30'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
          style={{ backgroundColor: collection.color ? `${collection.color}20` : undefined }}
        >
          {collection.icon || '📁'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{collection.name}</p>
          <p className="text-xs text-muted-foreground">{count} places</p>
        </div>
      </div>
    </button>
  );
}

export function SavedPlacesPage() {
  const { places, isLoading, collections, deletePlace, createCollection, deleteCollection } = useSavedPlaces();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('#6C63FF');

  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    places.forEach((p) => {
      if (p.collection_id) {
        counts[p.collection_id] = (counts[p.collection_id] || 0) + 1;
      }
    });
    return counts;
  }, [places]);

  const filteredPlaces = useMemo(() => {
    let filtered = places;
    if (selectedCollection) {
      filtered = filtered.filter((p) => p.collection_id === selectedCollection);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.country?.toLowerCase().includes(q) ||
          p.place_type.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [places, selectedCollection, searchQuery]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      await createCollection.mutateAsync({
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim(),
        color: newCollectionColor,
      });
      setNewCollectionName('');
      setNewCollectionDesc('');
      setShowCreateCollection(false);
    } catch {
      // handled by react-query
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-2.5">
              <Bookmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Saved Places</h1>
              <p className="text-sm text-muted-foreground">
                {places.length} place{places.length !== 1 ? 's' : ''} saved across {collections.length} collections
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid3X3 className="h-4 w-4" />
            )}
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar - Collections */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Package className="h-4 w-4 text-muted-foreground" />
              Collections
            </h2>
            <button
              onClick={() => setShowCreateCollection(!showCreateCollection)}
              className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Create collection"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>

          {/* Create collection form */}
          {showCreateCollection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 overflow-hidden rounded-xl border border-border/50 bg-muted/30 p-3"
            >
              <Input
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="mb-2 text-sm"
                autoFocus
              />
              <Input
                placeholder="Description (optional)"
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                className="mb-2 text-sm"
              />
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Color:</span>
                {['#6C63FF', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCollectionColor(color)}
                    className={`h-5 w-5 cursor-pointer rounded-full transition-transform ${
                      newCollectionColor === color ? 'scale-125 ring-2 ring-ring' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateCollection} disabled={!newCollectionName.trim()}>
                  Create
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCreateCollection(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {/* Collection list */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedCollection(null)}
              className={cn(
                'w-full cursor-pointer rounded-xl border p-3 text-left transition-all duration-200',
                !selectedCollection
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30 hover:bg-muted/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">All Places</p>
                  <p className="text-xs text-muted-foreground">{places.length} places</p>
                </div>
              </div>
            </button>
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                isActive={selectedCollection === collection.id}
                onClick={() => setSelectedCollection(collection.id)}
                count={collectionCounts[collection.id] || 0}
              />
            ))}
          </div>

          {collections.length === 0 && !showCreateCollection && (
            <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-center">
              <FolderPlus className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                Create collections to organize your saved places
              </p>
            </div>
          )}
        </div>

        {/* Main area */}
        <div className="min-w-0 flex-1">
          {/* Search & filter */}
          <div className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search saved places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                aria-label="Search saved places"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : filteredPlaces.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <MapPin className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {searchQuery ? 'No results found' : 'No saved places yet'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Save places you love from trip itineraries and recommendations'}
              </p>
              {!searchQuery && (
                <Button className="mt-4 gap-2" onClick={() => window.history.back()}>
                  <Sparkles className="h-4 w-4" />
                  Plan a Trip
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid view */
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} onDelete={deletePlace.mutate} />
              ))}
            </motion.div>
          ) : (
            /* List view */
            <div className="flex flex-col gap-2">
              {filteredPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} onDelete={deletePlace.mutate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}