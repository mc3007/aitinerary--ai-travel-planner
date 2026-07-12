import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  UtensilsCrossed,
  Dog,
  Baby,
  Globe,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DestinationList } from './components/DestinationList';
import { TransportSelector } from './components/TransportSelector';
import { BudgetEstimator } from './components/BudgetEstimator';
import { INTERESTS, FOOD_PREFERENCES, TRANSPORT_MODES } from '../../types/itinerary';

interface PlannerFormProps {
  onGenerate: (data: FormState) => void;
  onDestinationDetails?: (details: import('./components/DestinationList').DestinationEntry[]) => void;
  initialDestinations?: string[];
  prefill?: Partial<FormState>;
}

export type AiProviderOption = 'auto' | 'gemini' | 'natively';

export interface FormState {
  destinations: string[];
  budget?: number;
  currency: string;
  duration: number;
  startDate: string;
  people: number;
  transportPreferences: string[];
  budgetAllocation: {
    accommodation?: number;
    dining?: number;
    commute?: number;
    activities?: number;
    miscellaneous?: number;
  };
  interests: string[];
  foodPreferences: string[];
  children: number;
  pets: boolean;
  accessibility: string[];
  visaNeeded: boolean;
  aiProvider: AiProviderOption;
}

const normalizeDate = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().split('T')[0];
};

export function TripPlannerForm({ onGenerate, onDestinationDetails, initialDestinations, prefill }: PlannerFormProps) {
  const [destinations, setDestinations] = useState<string[]>(initialDestinations || []);
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');
  const [startDate, setStartDate] = useState('');
  const [people, setPeople] = useState('1');
  const [transportPreferences, setTransportPreferences] = useState<string[]>([]);
  const [budgetAllocation, setBudgetAllocation] = useState<FormState['budgetAllocation']>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [foodPreferences, setFoodPreferences] = useState<string[]>([]);
  const [children, setChildren] = useState('0');
  const [pets, setPets] = useState(false);
  const [visaNeeded, setVisaNeeded] = useState(false);
  const [aiProvider, setAiProvider] = useState<AiProviderOption>('auto');
  const [generating, setGenerating] = useState(false);
  const [currency, setCurrency] = useState(prefill?.currency || 'USD');

  useEffect(() => {
    if (!prefill) return;
    if (prefill.destinations && prefill.destinations.length > 0) {
      setDestinations(prefill.destinations);
    }
    if (typeof prefill.budget === 'number' && prefill.budget >= 0) {
      setBudget(String(prefill.budget));
    }
    if (typeof prefill.duration === 'number' && prefill.duration > 0) {
      setDuration(String(prefill.duration));
    }
    const normalizedDate = normalizeDate(prefill.startDate);
    if (normalizedDate) setStartDate(normalizedDate);
    if (typeof prefill.people === 'number' && prefill.people >= 1) {
      setPeople(String(prefill.people));
    }
    if (Array.isArray(prefill.transportPreferences)) {
      const valid = prefill.transportPreferences.filter((id) =>
        TRANSPORT_MODES.some((m) => m.id === id)
      );
      setTransportPreferences(valid);
    }
    if (prefill.budgetAllocation && typeof prefill.budgetAllocation === 'object') {
      setBudgetAllocation(prefill.budgetAllocation);
    }
    if (Array.isArray(prefill.interests)) {
      setInterests(prefill.interests.filter((i) => INTERESTS.includes(i)));
    }
    if (Array.isArray(prefill.foodPreferences)) {
      setFoodPreferences(prefill.foodPreferences.filter((f) => FOOD_PREFERENCES.includes(f)));
    }
    if (typeof prefill.children === 'number' && prefill.children >= 0) {
      setChildren(String(prefill.children));
    }
    if (typeof prefill.pets === 'boolean') {
      setPets(prefill.pets);
    }
    if (typeof prefill.visaNeeded === 'boolean') {
      setVisaNeeded(prefill.visaNeeded);
    }
    if (prefill.aiProvider && ['auto', 'gemini', 'natively'].includes(prefill.aiProvider)) {
      setAiProvider(prefill.aiProvider);
    }
    if (prefill.currency) {
      setCurrency(prefill.currency);
    }
  }, [prefill]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((s) => s !== interest)
        : [...prev, interest]
    );
  };

  const toggleFoodPref = (pref: string) => {
    setFoodPreferences((prev) =>
      prev.includes(pref)
        ? prev.filter((s) => s !== pref)
        : [...prev, pref]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destinations.length < 1) return;

    setGenerating(true);
    onGenerate({
      destinations,
      budget: budget ? Number(budget) : undefined,
      currency,
      duration: Number(duration),
      startDate,
      people: Number(people),
      transportPreferences,
      budgetAllocation,
      interests,
      foodPreferences,
      children: Number(children),
      pets,
      accessibility: [],
      visaNeeded,
      aiProvider,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destinations (multi-city support) */}
        <DestinationList
          destinations={destinations}
          onChange={setDestinations}
          onDestinationDetails={onDestinationDetails}
          errors={
            destinations.length === 0
              ? ['Add at least one destination']
              : undefined
          }
        />

        {/* Duration and Start Date */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="duration">Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="e.g. 7"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              min={1}
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* People */}
        <div>
          <Label htmlFor="people">Number of People</Label>
          <div className="relative mt-1.5">
            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="people"
              type="number"
              min={1}
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Transport Modes */}
        <TransportSelector
          selected={transportPreferences}
          onChange={setTransportPreferences}
          editable
        />

        {/* Budget (optional) */}
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="budget" className="text-sm font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Budget <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            {budget && (
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                AI will optimize allocation
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input
              id="budget"
              type="number"
              placeholder="Enter total budget or leave empty for AI estimate"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="pl-7"
              min={0}
            />
          </div>

          {budget && (
            <BudgetEstimator
              totalBudget={Number(budget)}
              allocation={budgetAllocation}
              onChange={setBudgetAllocation}
            />
          )}
        </div>

        {/* Interests */}
        <div>
          <Label>Interests</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.slice(0, 8).map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
                  interests.includes(interest)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Food Preferences */}
        <div>
          <Label>Food Preferences</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {FOOD_PREFERENCES.map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => toggleFoodPref(pref)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
                  foodPreferences.includes(pref)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="children">Children (count)</Label>
            <div className="relative mt-1.5">
              <Baby className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="children"
                type="number"
                min={0}
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label>Extras</Label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setPets(!pets)}
                className={`cursor-pointer flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all duration-200 ${
                  pets
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                <Dog className="h-4 w-4" />
                Pets
              </button>
              <button
                type="button"
                onClick={() => setVisaNeeded(!visaNeeded)}
                className={`cursor-pointer flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all duration-200 ${
                  visaNeeded
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                <Globe className="h-4 w-4" />
                Visa Needed
              </button>
            </div>
          </div>
        </div>

        {/* AI Provider Selector */}
        <div>
          <Label>AI Provider</Label>
          <p className="text-[10px] text-muted-foreground mb-2">
            Gemini is the default (fast). Falls back to Natively AI automatically if unavailable.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { value: 'auto' as const, label: 'Auto (Recommended)', desc: 'Gemini → Natively AI fallback' },
              { value: 'gemini' as const, label: 'Google Gemini', desc: 'Gemini 2.0 Flash' },
              { value: 'natively' as const, label: 'Natively AI', desc: 'GPT-4o fallback provider' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAiProvider(value)}
                className={`cursor-pointer flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left text-xs transition-all duration-200 ${
                  aiProvider === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="opacity-70">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2"
          disabled={generating || destinations.length === 0}
        >
          {generating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {destinations.length > 1
                ? `Generate ${destinations.length}-City Itinerary`
                : 'Generate Itinerary'}
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}