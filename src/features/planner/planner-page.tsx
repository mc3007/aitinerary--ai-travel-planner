import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Map as MapIcon,
  List,
  Save,
  Loader2,
  Info,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { TripPlannerForm, type FormState } from './trip-planner-form';
import { ItineraryTimeline } from './timeline-view';
import { MapView } from './map-view';
import {
  generateItinerary,
  generateMockItinerary,
  PROVIDER_INFO,
} from '../../lib/ai-service';
import type { AiResult, ProviderName } from '../../lib/ai-service';
import { useAuth } from '../../hooks/useAuth';
import { useTrips } from '../../hooks/useTrips';

export function PlannerPage() {
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveTrip } = useTrips();

  const itinerary = aiResult?.itinerary ?? null;
  const providerInfo = aiResult
    ? PROVIDER_INFO[aiResult.provider as keyof typeof PROVIDER_INFO]
    : null;

  const handleGenerate = async (data: FormState) => {
    setGenerating(true);
    setError('');
    setSaved(false);

    try {
      // Try the real API first, fall back to mock
      let result: AiResult;
      try {
        result = await generateItinerary(data);
      } catch {
        // If real API fails, use mock data for demo
        console.warn('AI API unavailable, using demo data');
        result = generateMockItinerary(data);
      }
      setAiResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate itinerary'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!itinerary || saved) return;
    setSaving(true);
    try {
      await saveTrip.mutateAsync({
        destination: itinerary.destinations[0] ?? '',
        budget: itinerary.totalBudget,
        currency: itinerary.currency,
        duration: itinerary.days.length,
        start_date: null,
        end_date: null,
        interests: [],
        itinerary_data: itinerary,
      });
      setSaved(true);
    } catch {
      // Continue without saving
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {itinerary ? 'Your Itinerary' : 'Plan Your Trip'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {itinerary
                ? `${itinerary.destinations[0] ?? 'Custom Trip'} • ${itinerary.days.length} days`
                : 'Tell us about your dream trip'}
            </p>
            {providerInfo && (
              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <Info className="h-3 w-3" />
                Powered by{' '}
                <Badge
                  variant="outline"
                  className="gap-1 px-1.5 py-0 text-[10px] font-normal"
                  style={{
                    borderColor: providerInfo.color,
                    color: providerInfo.color,
                  }}
                >
                  {providerInfo.icon} {providerInfo.name}
                </Badge>
                {aiResult?.model && ` • ${aiResult.model}`}
              </span>
            )}
          </div>
        </div>

        {itinerary && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving || saved}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? 'Saved' : 'Save Trip'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {generating ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Crafting Your Itinerary
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Our AI is analyzing your preferences...
          </p>
          <div className="mt-8 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      ) : itinerary ? (
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="timeline" className="gap-2">
              <List className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <MapIcon className="h-4 w-4" />
              Map
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            <ItineraryTimeline
              days={itinerary.days}
              currency={itinerary.currency}
            />
          </TabsContent>
          <TabsContent value="map">
            <MapView
              itinerary={itinerary}
              destination={itinerary.destinations[0] ?? ''}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="mx-auto max-w-lg">
          <TripPlannerForm onGenerate={handleGenerate} />
        </div>
      )}
    </motion.div>
  );
}