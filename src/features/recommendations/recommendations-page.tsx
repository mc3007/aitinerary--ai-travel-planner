import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Thermometer,
  ArrowRight,
  Compass,
  Star,
  X,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

interface Destination {
  name: string;
  emoji: string;
  reason: string;
  temp: string;
  region: string;
  bestFor: string[];
  rating: number;
  cost: '$' | '$$' | '$$$' | '$$$$';
}

const ALL_DESTINATIONS: Destination[] = [
  // Asia
  { name: 'Kyoto, Japan', emoji: '⛩️', reason: 'Cherry blossom season', temp: '15°C', region: 'Asia', bestFor: ['Culture', 'Food', 'History'], rating: 4.8, cost: '$$$' },
  { name: 'Bali, Indonesia', emoji: '🌴', reason: 'Spiritual retreat hotspot', temp: '30°C', region: 'Asia', bestFor: ['Beach', 'Wellness', 'Nature'], rating: 4.6, cost: '$$' },
  { name: 'Tokyo, Japan', emoji: '🗾', reason: 'Electric city vibes', temp: '18°C', region: 'Asia', bestFor: ['Food', 'Shopping', 'Culture'], rating: 4.9, cost: '$$$' },
  { name: 'Bangkok, Thailand', emoji: '🌺', reason: 'Street food paradise', temp: '32°C', region: 'Asia', bestFor: ['Food', 'Nightlife', 'Culture'], rating: 4.5, cost: '$' },
  { name: 'Singapore', emoji: '🏙️', reason: 'Futuristic city-state', temp: '28°C', region: 'Asia', bestFor: ['Food', 'Shopping', 'Architecture'], rating: 4.6, cost: '$$$' },
  { name: 'Hanoi, Vietnam', emoji: '🇻🇳', reason: 'Old-world charm meets energy', temp: '25°C', region: 'Asia', bestFor: ['History', 'Food', 'Adventure'], rating: 4.4, cost: '$' },
  { name: 'Seoul, South Korea', emoji: '🇰🇷', reason: 'K-culture epicenter', temp: '16°C', region: 'Asia', bestFor: ['Food', 'Shopping', 'Nightlife'], rating: 4.7, cost: '$$' },
  { name: 'Mumbai, India', emoji: '🕌', reason: 'Bollywood & street food', temp: '28°C', region: 'Asia', bestFor: ['Culture', 'Food', 'History'], rating: 4.3, cost: '$' },
  { name: 'Chiang Mai, Thailand', emoji: '🏔️', reason: 'Mountain temples & night markets', temp: '24°C', region: 'Asia', bestFor: ['Culture', 'Nature', 'Wellness'], rating: 4.5, cost: '$' },

  // Europe
  { name: 'Barcelona, Spain', emoji: '🏖️', reason: 'Perfect beach weather', temp: '24°C', region: 'Europe', bestFor: ['Beach', 'Architecture', 'Food'], rating: 4.7, cost: '$$' },
  { name: 'Lisbon, Portugal', emoji: '🇵🇹', reason: 'Affordable luxury', temp: '22°C', region: 'Europe', bestFor: ['Culture', 'Food', 'History'], rating: 4.6, cost: '$$' },
  { name: 'Paris, France', emoji: '🗼', reason: 'City of light & love', temp: '16°C', region: 'Europe', bestFor: ['Art', 'Food', 'History'], rating: 4.8, cost: '$$$' },
  { name: 'Rome, Italy', emoji: '🏛️', reason: 'Ancient history meets dolce vita', temp: '20°C', region: 'Europe', bestFor: ['History', 'Food', 'Art'], rating: 4.7, cost: '$$$' },
  { name: 'Santorini, Greece', emoji: '🏛️', reason: 'Iconic sunsets & blue domes', temp: '26°C', region: 'Europe', bestFor: ['Beach', 'Romance', 'Photography'], rating: 4.7, cost: '$$$' },
  { name: 'London, UK', emoji: '🇬🇧', reason: 'Royal history & modern edge', temp: '14°C', region: 'Europe', bestFor: ['History', 'Art', 'Shopping'], rating: 4.6, cost: '$$$' },
  { name: 'Amsterdam, Netherlands', emoji: '🌷', reason: 'Canals & creative culture', temp: '15°C', region: 'Europe', bestFor: ['Art', 'Culture', 'Nightlife'], rating: 4.5, cost: '$$$' },
  { name: 'Prague, Czech Republic', emoji: '🏰', reason: 'Fairytale city on a budget', temp: '12°C', region: 'Europe', bestFor: ['History', 'Architecture', 'Food'], rating: 4.4, cost: '$$' },
  { name: 'Swiss Alps, Switzerland', emoji: '🏔️', reason: 'Alpine adventure paradise', temp: '8°C', region: 'Europe', bestFor: ['Nature', 'Adventure', 'Photography'], rating: 4.8, cost: '$$$$' },
  { name: 'Dubrovnik, Croatia', emoji: '🌊', reason: 'Adriatic pearl', temp: '23°C', region: 'Europe', bestFor: ['Beach', 'History', 'Photography'], rating: 4.5, cost: '$$' },

  // North America
  { name: 'New York, USA', emoji: '🗽', reason: 'The city that never sleeps', temp: '18°C', region: 'North America', bestFor: ['Culture', 'Food', 'Shopping'], rating: 4.7, cost: '$$$$' },
  { name: 'Hawaii, USA', emoji: '🌺', reason: 'Tropical island paradise', temp: '27°C', region: 'North America', bestFor: ['Beach', 'Nature', 'Adventure'], rating: 4.7, cost: '$$$' },
  { name: 'Mexico City, Mexico', emoji: '🌮', reason: 'Vibrant culture & cuisine', temp: '22°C', region: 'North America', bestFor: ['Food', 'History', 'Art'], rating: 4.5, cost: '$' },
  { name: 'Vancouver, Canada', emoji: '🏔️', reason: 'Mountains meet ocean', temp: '14°C', region: 'North America', bestFor: ['Nature', 'Food', 'Adventure'], rating: 4.5, cost: '$$$' },
  { name: 'Cancún, Mexico', emoji: '🏖️', reason: 'Caribbean beach bliss', temp: '29°C', region: 'North America', bestFor: ['Beach', 'Nightlife', 'Adventure'], rating: 4.4, cost: '$$' },

  // South America
  { name: 'Rio de Janeiro, Brazil', emoji: '🇧🇷', reason: 'Carnival & natural wonders', temp: '30°C', region: 'South America', bestFor: ['Beach', 'Nightlife', 'Nature'], rating: 4.5, cost: '$$' },
  { name: 'Cusco, Peru', emoji: '🏔️', reason: 'Gateway to Machu Picchu', temp: '14°C', region: 'South America', bestFor: ['History', 'Adventure', 'Culture'], rating: 4.6, cost: '$$' },
  { name: 'Buenos Aires, Argentina', emoji: '💃', reason: 'Tango & steak paradise', temp: '22°C', region: 'South America', bestFor: ['Food', 'Nightlife', 'Culture'], rating: 4.5, cost: '$$' },
  { name: 'Cartagena, Colombia', emoji: '🏛️', reason: 'Colonial charm meets Caribbean', temp: '30°C', region: 'South America', bestFor: ['Beach', 'History', 'Nightlife'], rating: 4.4, cost: '$$' },

  // Oceania
  { name: 'Sydney, Australia', emoji: '🦘', reason: 'Harbour city adventure', temp: '22°C', region: 'Oceania', bestFor: ['Beach', 'Nature', 'Food'], rating: 4.6, cost: '$$$' },
  { name: 'New Zealand', emoji: '🏔️', reason: 'Middle-earth awaits', temp: '16°C', region: 'Oceania', bestFor: ['Adventure', 'Nature', 'Photography'], rating: 4.8, cost: '$$$' },
  { name: 'Fiji', emoji: '🏝️', reason: 'Ultimate island escape', temp: '28°C', region: 'Oceania', bestFor: ['Beach', 'Wellness', 'Nature'], rating: 4.7, cost: '$$$' },
  { name: 'Queenstown, New Zealand', emoji: '🏔️', reason: 'Adventure capital of the world', temp: '14°C', region: 'Oceania', bestFor: ['Adventure', 'Nature', 'Photography'], rating: 4.7, cost: '$$$' },

  // Africa & Middle East
  { name: 'Marrakech, Morocco', emoji: '🐪', reason: 'Exotic souks & riads', temp: '26°C', region: 'Africa', bestFor: ['Culture', 'Food', 'Shopping'], rating: 4.4, cost: '$$' },
  { name: 'Cape Town, South Africa', emoji: '🏔️', reason: 'Table Mountain & vineyards', temp: '22°C', region: 'Africa', bestFor: ['Nature', 'Adventure', 'Food'], rating: 4.6, cost: '$$' },
  { name: 'Dubai, UAE', emoji: '🌆', reason: 'Futuristic desert oasis', temp: '35°C', region: 'Middle East', bestFor: ['Shopping', 'Architecture', 'Nightlife'], rating: 4.5, cost: '$$$$' },
  { name: 'Cairo, Egypt', emoji: '🔺', reason: 'Pyramids & ancient wonders', temp: '30°C', region: 'Africa', bestFor: ['History', 'Culture', 'Adventure'], rating: 4.4, cost: '$$' },
  { name: 'Reykjavik, Iceland', emoji: '🌋', reason: 'Northern lights & geothermal', temp: '4°C', region: 'Europe', bestFor: ['Nature', 'Adventure', 'Photography'], rating: 4.6, cost: '$$$$' },
  { name: 'Zanzibar, Tanzania', emoji: '🏝️', reason: 'Spice island paradise', temp: '29°C', region: 'Africa', bestFor: ['Beach', 'Culture', 'Nature'], rating: 4.5, cost: '$$' },
];

const REGIONS = ['All', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Africa', 'Middle East'];
const INTERESTS = ['All', 'Beach', 'Nature', 'Food', 'History', 'Culture', 'Adventure', 'Shopping', 'Nightlife', 'Art', 'Photography', 'Wellness'];

export function RecommendationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedInterest, setSelectedInterest] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState<'All' | '$' | '$$' | '$$$' | '$$$$'>('All');

  const filtered = useMemo(() => {
    return ALL_DESTINATIONS.filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedRegion !== 'All' && d.region !== selectedRegion) return false;
      if (selectedInterest !== 'All' && !d.bestFor.includes(selectedInterest)) return false;
      if (budgetFilter !== 'All' && d.cost !== budgetFilter) return false;
      return true;
    });
  }, [search, selectedRegion, selectedInterest, budgetFilter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-2.5">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recommended Destinations</h1>
            <p className="mt-1 text-muted-foreground">
              Discover {ALL_DESTINATIONS.length} hand-picked destinations for your next adventure
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destinations..."
              className="h-10 border-border/50 bg-background pl-9 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-2 ${showFilters ? 'border-primary text-primary' : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(selectedRegion !== 'All' || selectedInterest !== 'All' || budgetFilter !== 'All') && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-[10px]">
                {[selectedRegion, selectedInterest, budgetFilter].filter((f) => f !== 'All').length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border/50 bg-card/50 p-4"
          >
            {/* Region */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Region</p>
              <div className="flex flex-wrap gap-1.5">
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      selectedRegion === region
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-muted-foreground hover:bg-accent/80'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Interest */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Interest</p>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => setSelectedInterest(interest)}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      selectedInterest === interest
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-muted-foreground hover:bg-accent/80'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Budget Level</p>
              <div className="flex flex-wrap gap-1.5">
                {(['All', '$', '$$', '$$$', '$$$$'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setBudgetFilter(level)}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      budgetFilter === level
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-muted-foreground hover:bg-accent/80'
                    }`}
                  >
                    {level === 'All' ? 'Any Budget' : level}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Result count & clear */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} destination{filtered.length !== 1 ? 's' : ''} found</span>
          {(search || selectedRegion !== 'All' || selectedInterest !== 'All' || budgetFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedRegion('All');
                setSelectedInterest('All');
                setBudgetFilter('All');
              }}
              className="flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline"
            >
              <X className="h-3 w-3" />
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Destination Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((dest, i) => (
          <motion.div
            key={dest.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card
              className="group cursor-pointer border-border/50 transition-all duration-200 hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
              onClick={() => navigate(`/planner?destination=${encodeURIComponent(dest.name)}`)}
            >
              <CardContent className="p-4">
                {/* Emoji & Rating */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-3xl">{dest.emoji}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium text-foreground">{dest.rating}</span>
                  </div>
                </div>

                {/* Name & Info */}
                <CardTitle className="mb-1 text-base">{dest.name}</CardTitle>
                <p className="mb-3 text-xs text-muted-foreground">{dest.reason}</p>

                {/* Tags */}
                <div className="mb-3 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="flex items-center gap-1 text-[10px]">
                    <Thermometer className="h-3 w-3" />
                    {dest.temp}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">{dest.cost}</Badge>
                  <Badge variant="secondary" className="flex items-center gap-1 text-[10px]">
                    <MapPin className="h-3 w-3" />
                    {dest.region}
                  </Badge>
                </div>

                {/* Best for */}
                <div className="flex flex-wrap gap-1">
                  {dest.bestFor.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-primary/5 px-2 py-0.5 text-[10px] text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                  {dest.bestFor.length > 3 && (
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
                      +{dest.bestFor.length - 3}
                    </span>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-3 flex items-center justify-end gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Plan a trip
                  <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-16"
        >
          <Compass className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground">No destinations found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters or search term
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearch('');
              setSelectedRegion('All');
              setSelectedInterest('All');
              setBudgetFilter('All');
            }}
          >
            Clear Filters
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
