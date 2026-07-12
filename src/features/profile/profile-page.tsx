import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  MapPin,
  Globe,
  Heart,
  Plane,
  Hotel,
  Languages,
  Accessibility,
  ChefHat,
  Footprints,
  Calendar,
  Sparkles,
  Save,
  ChevronRight,
} from 'lucide-react';
import { useProfile } from '../../hooks/useTrips';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  TRAVEL_STYLES,
  INTERESTS,
  CURRENCIES,
  FOOD_PREFERENCES,
} from '../../types/itinerary';

const PACES = [
  { id: 'relaxed', label: '🐢 Relaxed', desc: 'Slow mornings, plenty of downtime' },
  { id: 'moderate', label: '🚶 Moderate', desc: 'Balanced days with some free time' },
  { id: 'packed', label: '🏃 Packed', desc: 'Maximize every hour of the day' },
];

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair Accessible',
  'Limited Walking',
  'Visual Impairment Friendly',
  'Hearing Impairment Friendly',
  'Quiet Spaces Needed',
  'None of the above',
];

const WALKING_DISTANCES = [
  { id: '500', label: '~500m (Short walks)' },
  { id: '1000', label: '~1km (Moderate)' },
  { id: '2000', label: '~2km (Active)' },
  { id: '5000', label: '5km+ (Very active)' },
];

const DAILY_ACTIVITY_COUNTS = [
  { id: '3', label: '3–4 (Relaxed)' },
  { id: '5', label: '5–7 (Balanced)' },
  { id: '8', label: '8–10 (Packed)' },
  { id: '12', label: '12+ (Maximize)' },
];

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/50 transition-all duration-200 hover:border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ChipSelector({
  options,
  selected,
  onChange,
  multi,
}: {
  options: readonly string[] | string[];
  selected: string[];
  onChange: (val: string[]) => void;
  multi?: boolean;
}) {
  const toggle = (value: string) => {
    if (multi) {
      onChange(
        selected.includes(value)
          ? selected.filter((s) => s !== value)
          : [...selected, value]
      );
    } else {
      onChange([value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => toggle(option)}
          className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200 ${
            selected.includes(option)
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-muted-foreground/30'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function ProfilePage() {
  const { profile, isLoading, upsertProfile } = useProfile();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profile?.name || '');
  const [currency, setCurrency] = useState(profile?.currency || 'USD');
  const [travelStyle, setTravelStyle] = useState<string[]>(profile?.travel_style || []);
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);
  const [pace, setPace] = useState(profile?.pace || 'moderate');
  const [foodPreferences, setFoodPreferences] = useState<string[]>(profile?.food_preferences || []);
  const [accessibility, setAccessibility] = useState<string[]>(profile?.accessibility || []);
  const [walkingDistance, setWalkingDistance] = useState(profile?.preferred_walking_distance || '1000');
  const [dailyActivityCount, setDailyActivityCount] = useState(profile?.preferred_daily_activity_count || '5');
  const [homeAirport, setHomeAirport] = useState(profile?.home_airport || '');
  const [languages, setLanguages] = useState(profile?.languages?.join(', ') || '');
  const [favoriteCuisine, setFavoriteCuisine] = useState(profile?.favorite_cuisine || '');

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertProfile.mutateAsync({
        name: name || 'Traveler',
        currency,
        travel_style: travelStyle,
        pace,
        interests,
        food_preferences: foodPreferences,
        accessibility,
        preferred_walking_distance: parseInt(walkingDistance),
        preferred_daily_activity_count: parseInt(dailyActivityCount),
        home_airport: homeAirport || null,
        languages: languages
          ? languages.split(',').map((l) => l.trim()).filter(Boolean)
          : null,
        favorite_cuisine: favoriteCuisine || null,
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2.5">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Travel Profile</h1>
            <p className="text-sm text-muted-foreground">
              Your preferences help the AI create personalized itineraries
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Basic Info */}
        <SectionCard title="Basic Info" icon={User}>
          <div className="space-y-3">
            <Input
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should we call you?"
            />
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Preferred Currency</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {CURRENCIES.slice(0, 12).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`cursor-pointer rounded-xl border p-2 text-center transition-all duration-200 ${
                      currency === c.code
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-lg font-bold">{c.symbol}</div>
                    <div className="text-[10px] text-muted-foreground">{c.code}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Travel Style & Pace */}
        <SectionCard title="Travel Style & Pace" icon={Heart}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Travel Style</label>
              <ChipSelector
                options={TRAVEL_STYLES}
                selected={travelStyle}
                onChange={setTravelStyle}
                multi
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Pace</label>
              <div className="flex flex-col gap-2">
                {PACES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPace(p.id)}
                    className={`cursor-pointer rounded-xl border p-3 text-left transition-all duration-200 ${
                      pace === p.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-sm font-semibold">{p.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Interests & Food */}
        <SectionCard title="Interests & Food" icon={ChefHat}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Interests</label>
              <ChipSelector options={INTERESTS} selected={interests} onChange={setInterests} multi />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Favorite Cuisine</label>
              <Input
                value={favoriteCuisine}
                onChange={(e) => setFavoriteCuisine(e.target.value)}
                placeholder="e.g. Italian, Japanese, Mexican"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Food Preferences</label>
              <ChipSelector
                options={FOOD_PREFERENCES}
                selected={foodPreferences}
                onChange={setFoodPreferences}
                multi
              />
            </div>
          </div>
        </SectionCard>

        {/* Comfort & Accessibility */}
        <SectionCard title="Comfort & Accessibility" icon={Accessibility}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Preferred Walking Distance</label>
              <div className="grid grid-cols-2 gap-2">
                {WALKING_DISTANCES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setWalkingDistance(d.id)}
                    className={`cursor-pointer rounded-xl border p-3 text-left transition-all duration-200 ${
                      walkingDistance === d.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-xs font-medium">
                      <Footprints className="mr-1 inline-block h-3.5 w-3.5" />
                      {d.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Daily Activity Count</label>
              <div className="grid grid-cols-2 gap-2">
                {DAILY_ACTIVITY_COUNTS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDailyActivityCount(d.id)}
                    className={`cursor-pointer rounded-xl border p-3 text-left transition-all duration-200 ${
                      dailyActivityCount === d.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-xs font-medium">
                      <Calendar className="mr-1 inline-block h-3.5 w-3.5" />
                      {d.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Accessibility Needs</label>
              <ChipSelector
                options={ACCESSIBILITY_OPTIONS}
                selected={accessibility}
                onChange={setAccessibility}
                multi
              />
            </div>
          </div>
        </SectionCard>

        {/* Travel Details */}
        <SectionCard title="Travel Details" icon={Plane}>
          <div className="space-y-3">
            <Input
              label="Home Airport (IATA code)"
              value={homeAirport}
              onChange={(e) => setHomeAirport(e.target.value.toUpperCase())}
              placeholder="e.g. JFK, LAX, LHR"
              maxLength={4}
            />
            <Input
              label="Languages You Speak"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="e.g. English, Spanish, Japanese"
            />
          </div>
        </SectionCard>

        {/* Profile Summary */}
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2.5">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Your profile powers AI recommendations
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  AITinerary uses your preferences to personalize every itinerary, suggest
                  hidden gems, and find activities you'll love. The more complete your profile,
                  the better your recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex items-center justify-between border-t border-border/30 pt-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}