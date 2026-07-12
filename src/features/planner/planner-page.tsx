import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Map as MapIcon,
  List,
  Save,
  Loader2,
  Info,
  Trash2,
  ExternalLink,
  CheckCircle2,
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
import type { AiResult } from '../../lib/ai-service';
import { useAuth } from '../../hooks/useAuth';
import { useTrips, useTrip } from '../../hooks/useTrips';
import type { ItineraryResponse, DayPlan } from '../../types/itinerary';
import {
  detectHomeCurrency,
  getExchangeRates,
  DISCLAIMER_TEXT,
} from '../../lib/currency';
import { searchLocations } from '../../lib/geocoding';
import type { DestinationEntry } from './components/DestinationList';
import { useProfile } from '../../hooks/useTrips';

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function PlannerPage() {
  const { id: tripId } = useParams<{ id: string }>();
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<FormState | null>(null);
  const [destinationDetails, setDestinationDetails] = useState<DestinationEntry[]>([]);
  const [homeCurrency, setHomeCurrency] = useState('USD');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { saveTrip, updateTrip, deleteTrip } = useTrips();
  const { profile } = useProfile();
  const { trip: savedTrip, isLoading: tripLoading } = useTrip(tripId);

  const isEditingSaved = !!tripId;

  // Extract initial destination from query param
  const initialDestinations = searchParams.get('destination')
    ? [searchParams.get('destination')!]
    : undefined;

  // Detect home currency from browser locale or profile
  useEffect(() => {
    if (profile?.currency) {
      setHomeCurrency(profile.currency);
    } else {
      setHomeCurrency(detectHomeCurrency());
    }
  }, [profile?.currency]);

  // Load saved trip data into the editing view
  useEffect(() => {
    if (!savedTrip?.itinerary_data) return;
    // Populate aiResult from saved itinerary data
    const itineraryData = savedTrip.itinerary_data as unknown as ItineraryResponse;
    setAiResult({
      itinerary: itineraryData,
      provider: 'saved',
    } as AiResult);
    // Populate formData from saved trip
    setFormData({
      destinations: savedTrip.destinations || itineraryData.destinations,
      budget: savedTrip.budget || itineraryData.totalBudget,
      currency: savedTrip.currency || itineraryData.currency || 'USD',
      duration: savedTrip.duration || itineraryData.days.length,
      startDate: savedTrip.start_date || '',
      people: savedTrip.companion_count || 1,
      transportPreferences: (savedTrip.preferences as Record<string, unknown>)?.transport as string[] || [],
      budgetAllocation: (savedTrip.preferences as Record<string, unknown>)?.budgetAllocation as FormState['budgetAllocation'] || {},
      interests: savedTrip.interests || [],
      foodPreferences: (savedTrip.preferences as Record<string, unknown>)?.food as string[] || [],
      children: (savedTrip.preferences as Record<string, unknown>)?.children as number || 0,
      pets: (savedTrip.preferences as Record<string, unknown>)?.pets as boolean || false,
      accessibility: (savedTrip.preferences as Record<string, unknown>)?.accessibility as string[] || [],
      visaNeeded: (savedTrip.preferences as Record<string, unknown>)?.visaNeeded as boolean || false,
      aiProvider: 'auto',
    });
  }, [savedTrip]);

  // When the user navigates to /planner#new-trip, clear any in-progress itinerary
  useEffect(() => {
    if (location.hash === '#new-trip' && !tripId) {
      setAiResult(null);
      setFormData(null);
      setSaved(false);
      setError('');
      setDestinationDetails([]);
      setTimeout(() => {
        document
          .getElementById('planner-form')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash, tripId]);

  const itinerary = aiResult?.itinerary ?? null;
  const providerInfo = aiResult
    ? PROVIDER_INFO[aiResult.provider as keyof typeof PROVIDER_INFO]
    : null;

  const handleGenerate = async (data: FormState) => {
    setGenerating(true);
    setError('');
    setSaved(false);
    setFormData(data);

    try {
      const primaryDest = destinationDetails[0];
      let localCurrency = primaryDest?.currency?.code || 'USD';

      let result: AiResult;
      try {
        result = await generateItinerary(data);
      } catch {
        console.warn('AI API unavailable, using demo data');
        result = generateMockItinerary(data);
      }

      // Geocode destinations
      const enrichedLocations: ItineraryResponse['locations'] = [];
      for (const destName of result.itinerary.destinations) {
        if (destName) {
          try {
            const geoResults = await searchLocations(destName, 1);
            if (geoResults.length > 0) {
              enrichedLocations.push({
                name: destName,
                lat: geoResults[0].lat,
                lng: geoResults[0].lng,
              });
            }
          } catch {
            // Silently skip geocoding failures
          }
        }
      }

      let enrichedItinerary: ItineraryResponse = {
        ...result.itinerary,
        locations: enrichedLocations.length > 0
          ? enrichedLocations
          : result.itinerary.locations,
      };

      try {
        const rates = await getExchangeRates('USD');
        if (localCurrency !== homeCurrency && rates.rates[localCurrency]) {
          enrichedItinerary = {
            ...enrichedItinerary,
            currency: localCurrency,
            homeCurrency,
            exchangeRate: rates.rates[localCurrency],
            disclaimer: DISCLAIMER_TEXT,
            totalBudget: enrichedItinerary.totalBudget,
            budgetBreakdown: enrichedItinerary.budgetBreakdown,
          };
        }
      } catch {
        enrichedItinerary = {
          ...enrichedItinerary,
          currency: localCurrency,
          homeCurrency,
          disclaimer: DISCLAIMER_TEXT,
        };
      }

      setAiResult({
        ...result,
        itinerary: enrichedItinerary,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate itinerary'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleItineraryUpdate = useCallback(
    (updatedDays: DayPlan[]) => {
      if (!aiResult) return;
      const newTotal = updatedDays.reduce(
        (sum, day) =>
          sum + day.activities.reduce((s, a) => s + (a.estimatedCost || 0), 0),
        0
      );
      setAiResult({
        ...aiResult,
        itinerary: {
          ...aiResult.itinerary,
          days: updatedDays,
          totalBudget: newTotal,
        },
      });
    },
    [aiResult]
  );

  const handleSave = async () => {
    if (!itinerary || saved) return;
    setSaving(true);
    setError('');
    try {
      const startDate = formData?.startDate?.trim() ? formData.startDate : null;
      const endDate =
        startDate && (formData?.duration ?? itinerary.days.length) > 0
          ? addDays(startDate, (formData?.duration ?? itinerary.days.length) - 1)
          : null;

      const destinationsToSave =
        destinationDetails.length > 0
          ? destinationDetails.map((d, i) => ({
              name: d.name,
              nights: d.nights || 1,
              order_index: i,
            }))
          : itinerary.destinations.map((name, i) => ({
              name,
              nights: 1,
              order_index: i,
            }));

      const primaryCurrency = itinerary.currency || destinationDetails[0]?.currency?.code || homeCurrency || 'USD';

      if (isEditingSaved && tripId) {
        // Update existing trip
        await updateTrip.mutateAsync({
          id: tripId,
          destination: itinerary.destinations[0] ?? '',
          budget: itinerary.totalBudget ?? 0,
          currency: primaryCurrency,
          duration: itinerary.days.length,
          start_date: startDate,
          end_date: endDate,
          interests: formData?.interests ?? [],
          companion_count: formData?.people ?? 1,
          preferences: formData
            ? {
                transport: formData.transportPreferences,
                budgetAllocation: formData.budgetAllocation,
                food: formData.foodPreferences,
                children: formData.children,
                pets: formData.pets,
                accessibility: formData.accessibility,
                visaNeeded: formData.visaNeeded,
              }
            : {},
          itinerary_data: itinerary,
        });
      } else {
        // Save as new trip
        await saveTrip.mutateAsync({
          destination: itinerary.destinations[0] ?? '',
          destinations: destinationsToSave,
          budget: itinerary.totalBudget ?? 0,
          currency: primaryCurrency,
          duration: itinerary.days.length,
          start_date: startDate,
          end_date: endDate,
          interests: formData?.interests ?? [],
          companion_count: formData?.people ?? 1,
          preferences: formData
            ? {
                transport: formData.transportPreferences,
                budgetAllocation: formData.budgetAllocation,
                food: formData.foodPreferences,
                children: formData.children,
                pets: formData.pets,
                accessibility: formData.accessibility,
                visaNeeded: formData.visaNeeded,
                aiProvider: formData.aiProvider,
              }
            : {},
          itinerary_data: itinerary,
        });
      }
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save trip. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tripId) return;
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await deleteTrip.mutateAsync(tripId);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete trip.'
      );
    }
  };

  // Loading state for saved trip
  if (tripLoading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

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
              {itinerary ? (
                <>
                  {itinerary.destinations[0] ?? 'Your Trip'}
                  {isEditingSaved && saved && (
                    <Badge variant="secondary" className="ml-2 align-middle text-xs">
                      <CheckCircle2 className="mr-1 inline h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                </>
              ) : isEditingSaved && savedTrip ? (
                `Loading...`
              ) : (
                'Plan Your Trip'
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {itinerary
                ? `${itinerary.destinations[0] ?? 'Custom Trip'} • ${itinerary.days.length} days`
                : (isEditingSaved && savedTrip
                    ? `Edit your ${savedTrip.destination} trip`
                    : 'Tell us about your dream trip')}
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
            {isEditingSaved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard`)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={saved ? "secondary" : "default"}
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
              {saving ? 'Saving...' : saved ? (isEditingSaved ? 'Saved ✓' : 'Saved!') : isEditingSaved ? 'Save Changes' : 'Save Trip'}
            </Button>
          </div>
        )}
      </div>

      {itinerary?.disclaimer && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400">
          <Info className="inline h-3 w-3 mr-1.5 -mt-0.5" />
          {itinerary.disclaimer}
        </div>
      )}

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
          <TabsList className="mb-6 flex-wrap gap-1">
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
              homeCurrency={itinerary.homeCurrency}
              exchangeRate={itinerary.exchangeRate}
              onUpdate={handleItineraryUpdate}
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
        <div id="planner-form" className="mx-auto max-w-3xl scroll-mt-28">
          <TripPlannerForm
            onGenerate={handleGenerate}
            onDestinationDetails={setDestinationDetails}
            initialDestinations={initialDestinations}
            prefill={profile ? {
              budget: savedTrip?.budget || undefined,
              duration: savedTrip?.duration || undefined,
              startDate: savedTrip?.start_date || undefined,
              people: savedTrip?.companion_count || undefined,
              transportPreferences: (savedTrip?.preferences as Record<string, unknown>)?.transport as string[] || [],
              interests: savedTrip?.interests || profile.interests || [],
              foodPreferences: (savedTrip?.preferences as Record<string, unknown>)?.food as string[] || profile.food_preferences || [],
            } : undefined}
          />
        </div>
      )}
    </motion.div>
  );
}
