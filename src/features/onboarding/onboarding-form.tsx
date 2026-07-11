import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useProfile } from '../../hooks/useTrips';
import {
  TRAVEL_STYLES,
  INTERESTS,
  CURRENCIES,
} from '../../types/itinerary';

const steps = [
  { id: 'name', title: 'What should we call you?', subtitle: "Let's personalize your experience" },
  { id: 'currency', title: 'Select your currency', subtitle: 'We\'ll use this for budgeting' },
  { id: 'travel_style', title: 'How do you like to travel?', subtitle: 'Choose your travel style' },
  { id: 'interests', title: 'What are your interests?', subtitle: 'So we can suggest the best activities' },
];

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [travelStyle, setTravelStyle] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
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
        interests,
      });
      navigate('/dashboard');
    } catch {
      // Even if save fails, go to dashboard
      navigate('/dashboard');
    }
  };

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
        <div className="mb-8 flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
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
            <Button onClick={handleNext} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={saving}
              className="gap-2"
            >
              {saving ? 'Saving...' : 'Finish'}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}