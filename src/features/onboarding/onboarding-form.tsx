import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, ChevronLeft, Check, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useProfile } from '../../hooks/useTrips';
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

const BUDGET_RANGES = [
  { id: 'budget', label: '$', desc: 'Under $300 — save every penny' },
  { id: 'moderate', label: '$$', desc: '$300–$700 — comfortable balance' },
  { id: 'premium', label: '$$$', desc: '$700–$1500 — treat yourself' },
  { id: 'luxury', label: '$$$$', desc: 'Luxury — no limits' },
];

const ACCOMMODATIONS = [
  { id: 'hostel', label: 'Hostel', desc: 'Social, affordable, shared spaces' },
  { id: 'hotel', label: 'Hotel', desc: 'Comfortable, full-service stays' },
  { id: 'airbnb', label: 'Airbnb', desc: 'Home-like, private, local feel' },
  { id: 'resort', label: 'Resort', desc: 'All-inclusive, premium experience' },
];

const TRANSPORT_OPTIONS = [
  { id: 'walking', label: '🚶 Walking' },
  { id: 'car', label: '🚗 Car / Rental' },
  { id: 'train', label: '🚆 Train' },
  { id: 'flight', label: '✈️ Flight' },
  { id: 'bus', label: '🚌 Bus' },
];

const COMPANIONS = [
  { id: 'solo', label: 'Solo', desc: 'Just me — freedom to roam' },
  { id: 'partner', label: 'Partner', desc: 'Traveling with my significant other' },
  { id: 'family', label: 'Family', desc: 'Adults + kids' },
  { id: 'friends', label: 'Friends', desc: 'A group adventure' },
];

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair Accessible',
  'Limited Walking',
  'Visual Impairment Friendly',
  'Hearing Impairment Friendly',
  'Quiet Spaces Needed',
  'None of the above',
];

const steps = [
  { id: 'name', title: 'What should we call you?', subtitle: "Let's personalize your experience" },
  { id: 'currency', title: 'Select your currency', subtitle: 'We\'ll use this for budgeting' },
  { id: 'travel_style', title: 'How do you like to travel?', subtitle: 'Choose your travel style' },
  { id: 'pace', title: 'What\'s your ideal pace?', subtitle: 'How jam-packed should your days be?' },
  { id: 'interests', title: 'What are your interests?', subtitle: 'So we can suggest the best activities' },
  { id: 'food', title: 'Any food preferences?', subtitle: 'We\'ll tailor restaurant suggestions' },
  { id: 'budget', title: 'What\'s your budget range?', subtitle: 'This helps us recommend the right experiences' },
  { id: 'accommodation', title: 'Where do you like to stay?', subtitle: 'Your preferred accommodation style' },
  { id: 'transport', title: 'How do you usually get around?', subtitle: 'Select all that apply' },
  { id: 'companions', title: 'Who do you usually travel with?', subtitle: 'This helps us recommend group-friendly spots' },
  { id: 'accessibility', title: 'Accessibility needs', subtitle: 'So we can recommend suitable places' },
];

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [travelStyle, setTravelStyle] = useState<string[]>([]);
  const [pace, setPace] = useState<string>('moderate');
  const [interests, setInterests] = useState<string[]>([]);
  const [foodPreferences, setFoodPreferences] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<string>('moderate');
  const [accommodation, setAccommodation] = useState<string>('hotel');
  const [transport, setTransport] = useState<string[]>(['walking']);
  const [companions, setCompanions] = useState<string>('solo');
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { upsertProfile } = useProfile();
  const navigate = useNavigate();

  const toggleTravelStyle = (style: string) => {
    setTravelStyle((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : [...prev, style]
    );
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((s) => s !== interest)
        : [...prev, interest]
    );
  };

  const toggleFood = (item: string) => {
    setFoodPreferences((prev) =>
      prev.includes(item)
        ? prev.filter((s) => s !== item)
        : [...prev, item]
    );
  };

  const toggleTransport = (item: string) => {
    setTransport((prev) =>
      prev.includes(item)
        ? prev.filter((s) => s !== item)
        : [...prev, item]
    );
  };

  const toggleAccessibility = (item: string) => {
    setAccessibility((prev) =>
      prev.includes(item)
        ? prev.filter((s) => s !== item)
        : [...prev, item]
    );
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await upsertProfile.mutateAsync({
        name: name || 'Traveler',
        currency,
        travel_style: travelStyle,
        pace,
        interests,
        food_preferences: foodPreferences,
        budget_range: budgetRange,
        accommodation_preference: accommodation,
        transport_preferences: transport,
        companion_preference: companions,
        accessibility,
        onboarding_completed: true,
      });
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  const progressPercent = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">AITinerary</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < step
                  ? 'bg-primary'
                  : i === step
                  ? 'bg-primary/50'
                  : 'bg-border'
              }`}
            />
          ))}
        </div>
        <p className="mb-6 text-center text-xs text-muted-foreground">
          {progressPercent}% complete
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
                <User className="h-3 w-3" />
                <span>Step {step + 1} of {steps.length}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {steps[step].title}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {steps[step].subtitle}
              </p>
            </div>

            {step === 0 && (
              <Input
                id="name"
                label="Your name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            )}

            {step === 1 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`cursor-pointer rounded-xl border p-3 text-left transition-all duration-200 ${
                      currency === c.code
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-lg font-bold">{c.symbol}</div>
                    <div className="text-xs text-muted-foreground">{c.code}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-wrap gap-2">
                {TRAVEL_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => toggleTravelStyle(style)}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm capitalize transition-all duration-200 ${
                      travelStyle.includes(style)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-3">
                {PACES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPace(p.id)}
                    className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                      pace === p.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-lg font-semibold">{p.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{p.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                      interests.includes(interest)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-wrap gap-2">
                {FOOD_PREFERENCES.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleFood(item)}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                      foodPreferences.includes(item)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {step === 6 && (
              <div className="flex flex-col gap-3">
                {BUDGET_RANGES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBudgetRange(b.id)}
                    className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                      budgetRange === b.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-lg font-semibold">{b.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{b.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 7 && (
              <div className="flex flex-col gap-3">
                {ACCOMMODATIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAccommodation(a.id)}
                    className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                      accommodation === a.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-lg font-semibold">{a.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{a.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 8 && (
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTransport(t.id)}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                      transport.includes(t.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {step === 9 && (
              <div className="flex flex-col gap-3">
                {COMPANIONS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCompanions(c.id)}
                    className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                      companions === c.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-lg font-semibold">{c.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{c.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 10 && (
              <div className="flex flex-wrap gap-2">
                {ACCESSIBILITY_OPTIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleAccessibility(item)}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                      accessibility.includes(item)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {step < steps.length - 1 ? (
            <Button onClick={handleNext} className="gap-2 active:scale-[0.97] transition-transform duration-150">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={saving}
              className="gap-2 active:scale-[0.97] transition-transform duration-150"
            >
              {saving ? 'Saving...' : 'Done! Set Up My Profile'}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}