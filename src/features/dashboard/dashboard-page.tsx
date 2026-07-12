import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useMemo, useRef } from 'react';
import {
  Plus,
  MapPin,
  Calendar,
  TrendingUp,
  Compass,
  Sparkles,
  Bot,
  ArrowRight,
  MessageSquareText,
  Globe,
  X,
  Clock,
  Heart,
  Stars,
  Bookmark,
  ChevronRight,
  Luggage,
  Wallet,
  CheckCircle2,
  UtensilsCrossed,
  Mountain,
  Landmark,
  Palmtree,
  Camera,
  ShoppingBag,
  Music,
  History,
  User,
  Zap,
  Dumbbell,
  Salad,
  Bed,
  Train,
  Users,
  ExternalLink,
  List,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useTrips, useProfile } from '../../hooks/useTrips';
import { useSavedPlaces } from '../../hooks/useSavedPlaces';
import { useNotifications } from '../../hooks/useNotifications';
import { AiChat } from '../planner/ai-chat';
import type { ItineraryResponse } from '../../types/itinerary';
import { ExploreView } from '../planner/explore-view';
import { ItineraryTimeline } from '../planner/timeline-view';
import { MapView } from '../planner/map-view';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

function getDestinationEmoji(destination: string): string {
  const emojiMap: Record<string, string> = {
    paris: '🗼', tokyo: '🗾', london: '🇬🇧', 'new york': '🗽',
    rome: '🏛️', barcelona: '🏖️', dubai: '🌆', singapore: '🏙️',
    bali: '🌴', sydney: '🦘', 'new zealand': '🏔️', thailand: '🌺',
    greece: '🏛️', hawaii: '🌺', maldives: '🏝️', switzerland: '🏔️',
    iceland: '🌋', japan: '⛩️', 'south korea': '🇰🇷', vietnam: '🇻🇳',
    india: '🕌', morocco: '🐪', egypt: '🔺', brazil: '🇧🇷',
    mexico: '🌮', peru: '🏔️', portugal: '🇵🇹', italy: '🍝',
    france: '🥐', spain: '💃', germany: '🍺', netherlands: '🌷',
  };
  const key = destination.toLowerCase().trim();
  for (const [name, emoji] of Object.entries(emojiMap)) {
    if (key.includes(name)) return emoji;
  }
  return '🌍';
}

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  const now = new Date();
  const diff = start.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getTripProgress(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now < s) return 0;
  if (now > e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

const INTEREST_ICONS: Record<string, typeof Mountain> = {
  'Art & Culture': Landmark,
  'Food & Dining': UtensilsCrossed,
  'Nature & Outdoors': Mountain,
  Shopping: ShoppingBag,
  Nightlife: Music,
  'History & Museums': History,
  'Adventure Sports': Mountain,
  Photography: Camera,
  'Wellness & Spa': Sparkles,
  'Local Experiences': Globe,
  Architecture: Landmark,
  'Music & Festivals': Music,
  Beach: Palmtree,
  Adventure: Mountain,
};

function getInterestIcon(interest: string) {
  const Icon = INTEREST_ICONS[interest] || MapPin;
  return Icon;
}

const RECOMMENDED_DESTINATIONS = [
  { name: 'Kyoto, Japan', emoji: '⛩️', reason: 'Cherry blossom season', temp: '15°C' },
  { name: 'Barcelona, Spain', emoji: '🏖️', reason: 'Perfect beach weather', temp: '24°C' },
  { name: 'Bali, Indonesia', emoji: '🌴', reason: 'Spiritual retreat hotspot', temp: '30°C' },
  { name: 'Lisbon, Portugal', emoji: '🇵🇹', reason: 'Affordable luxury', temp: '22°C' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { trips, isLoading: tripsLoading, saveTrip } = useTrips();
  const { places } = useSavedPlaces();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentItinerary, setCurrentItinerary] = useState<ItineraryResponse | null>(null);
  const [lastTripId, setLastTripId] = useState<string | null>(null);

  const upcomingTrips = useMemo(
    () => trips.filter((t) => t.start_date && new Date(t.start_date) > new Date()).slice(0, 3),
    [trips]
  );
  const activeTrips = useMemo(
    () => trips.filter((t) => {
      if (!t.start_date || !t.end_date) return false;
      const now = new Date();
      return now >= new Date(t.start_date) && now <= new Date(t.end_date);
    }),
    [trips]
  );
  const pastTrips = useMemo(
    () => trips.filter((t) => t.end_date && new Date(t.end_date) < new Date()),
    [trips]
  );

  const totalDaysPlanning = useMemo(
    () => trips.reduce((acc, t) => acc + (t.duration || 0), 0),
    [trips]
  );

  const userName = profile?.name || user?.email?.split('@')[0] || 'Traveler';

  const handleAiCreateTrip = async (itinerary: ItineraryResponse): Promise<string | undefined> => {
    try {
      const destination = itinerary.destinations?.[0] || 'Unknown Destination';
      const result = await saveTrip.mutateAsync({
        destination,
        budget: itinerary.totalBudget || 0,
        currency: itinerary.currency || 'USD',
        duration: itinerary.days?.length || 3,
        start_date: null,
        end_date: null,
        interests: [],
        itinerary_data: itinerary,
        destinations: itinerary.destinations?.map((name, i) => ({
          name,
          nights: 1,
          order_index: i,
        })) || [],
      });
      const tripId = result.id;
      setLastTripId(tripId);
      setCurrentItinerary(itinerary);
      // Scroll to the inline preview after a brief delay for the render
      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return tripId;
    } catch (err) {
      console.error('Failed to save trip:', err);
      throw err;
    }
  };

  const handleActionButton = (action: string, tripId?: string) => {
    if (action === 'open_timeline' && tripId) {
      navigate(`/trips/${tripId}`);
    } else if (action === 'open_map') {
      // Scroll to the inline preview
      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (action === 'edit_trip' && tripId) {
      navigate(`/trips/${tripId}`);
    } else if (action === 'generate_itinerary' && tripId) {
      navigate(`/trips/${tripId}`);
    } else if (action === 'save_trip') {
      // Already saved — scroll to preview
      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (action === 'new_trip') {
      navigate('/planner');
    }
  };

  const quickActions = [
    {
      label: 'New Trip',
      icon: Plus,
      action: () => navigate('/planner'),
      gradient: 'from-primary to-secondary',
      desc: 'Create a new Itinerary',
    },
    {
      label: 'Explore',
      icon: Compass,
      action: () => setActiveSection(activeSection === 'explore' ? null : 'explore'),
      gradient: 'from-emerald-400 to-teal-500',
      desc: 'Discover trending destinations',
    },
    {
      label: 'Travel Copilot',
      icon: Bot,
      action: () => setActiveSection(activeSection === 'ai-chat' ? null : 'ai-chat'),
      gradient: 'from-amber-400 to-orange-500',
      desc: 'Your personal AI travel assistant',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Welcome Section */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {userName}
            </h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="animate-pulse text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            {upcomingTrips.length > 0
              ? `You have ${upcomingTrips.length} trip${upcomingTrips.length > 1 ? 's' : ''} coming up`
              : activeTrips.length > 0
              ? 'You\'re on a trip right now! 🎉'
              : 'Ready to plan your next adventure?'}
          </p>
        </div>
      </div>

      {/* Onboarding Incomplete Banner */}
      {profile && !profile.onboarding_completed && !profileLoading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-950/20 dark:via-card dark:to-amber-950/20"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Your travel profile is incomplete
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Tell us about your style, pace, and interests — we'll tailor every recommendation to you.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/onboarding')}
              className="gap-2 whitespace-nowrap"
            >
              <User className="h-4 w-4" />
              Complete My Profile
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Luggage className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{trips.length}</p>
              <p className="text-xs text-muted-foreground">Total Trips</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <Calendar className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalDaysPlanning}</p>
              <p className="text-xs text-muted-foreground">Days Planned</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-500/10 p-2.5">
              <Bookmark className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{places.length}</p>
              <p className="text-xs text-muted-foreground">Saved Places</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-rose-500/10 p-2.5">
              <Heart className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pastTrips.length}</p>
              <p className="text-xs text-muted-foreground">Memories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div id="quick-actions" className="mb-6 grid gap-4 sm:grid-cols-3">
        {quickActions.map((action, i) => {
          const isActive =
            (action.label === 'Explore' && activeSection === 'explore') ||
            (action.label === 'Travel Copilot' && activeSection === 'ai-chat');
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <button
                onClick={action.action}
                className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl border bg-card p-6 text-left transition-all duration-300 hover:shadow-lg active:scale-[0.98] ${
                  isActive
                    ? 'border-primary/40 shadow-md'
                    : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <div
                  className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${action.gradient} p-3 transition-transform duration-150 active:scale-95`}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {action.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {action.desc}
                </p>
                <ArrowRight
                  className={`absolute bottom-6 right-6 h-5 w-5 transition-all duration-300 ${
                    isActive
                      ? 'rotate-90 text-primary'
                      : 'text-muted-foreground group-hover:translate-x-1'
                  }`}
                />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Inline Explore Section */}
      {activeSection === 'explore' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 overflow-hidden rounded-2xl border border-border/50 bg-card/50"
        >
          <div className="flex items-center justify-between border-b border-border/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 p-2">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Explore Destinations</h2>
                <p className="text-sm text-muted-foreground">Discover amazing places around the world</p>
              </div>
            </div>
            <button
              onClick={() => setActiveSection(null)}
              className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <ExploreView />
          </div>
        </motion.div>
      )}

      {/* Inline Travel Copilot Section */}
      {activeSection === 'ai-chat' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 overflow-hidden rounded-2xl border border-border/50 bg-card/50"
        >
          <div className="flex items-center justify-between border-b border-border/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 p-2">
                <MessageSquareText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Travel Copilot</h2>
                <p className="text-sm text-muted-foreground">Your AI travel assistant</p>
              </div>
            </div>
            <button
              onClick={() => setActiveSection(null)}
              className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <AiChat
              destinations={[]}
              currentItinerary={currentItinerary}
              onUpdateItinerary={setCurrentItinerary}
              profile={profile}
              onCreateTrip={handleAiCreateTrip}
              onActionButton={handleActionButton}
            />
          </div>
        </motion.div>
      )}

      {/* Inline Trip Preview — shown after AI generates a trip */}
      {currentItinerary && lastTripId && (
        <div ref={previewRef} className="mb-6 scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-border/50 bg-card"
          >
            <div className="flex items-center justify-between border-b border-border/30 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {currentItinerary.destinations?.[0] || 'Trip'} Preview
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Generated by Travel Copilot •{' '}
                    {currentItinerary.days?.length || 0} day{(currentItinerary.days?.length || 0) !== 1 ? 's' : ''}
                    {currentItinerary.totalBudget
                      ? ` • ${new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: currentItinerary.currency || 'USD',
                          minimumFractionDigits: 0,
                        }).format(currentItinerary.totalBudget)}`
                      : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => navigate(`/trips/${lastTripId}`)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Full Planner
                </Button>
                <button
                  onClick={() => {
                    setCurrentItinerary(null);
                    setLastTripId(null);
                  }}
                  className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="timeline" className="gap-1.5 text-xs">
                    <List className="h-4 w-4" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="map" className="gap-1.5 text-xs">
                    <MapPin className="h-4 w-4" />
                    Map View
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="timeline" className="mt-0">
                  <div className="max-h-[500px] overflow-y-auto rounded-xl border border-border/30">
                    <ItineraryTimeline
                      days={currentItinerary.days || []}
                      currency={currentItinerary.currency || 'USD'}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="map" className="mt-0">
                  <div className="h-[400px] overflow-hidden rounded-xl border border-border/30">
                    <MapView
                      itinerary={currentItinerary}
                      destination={currentItinerary.destinations?.[0] || ''}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Activity summary row */}
            <div className="border-t border-border/30 px-6 py-3">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Timeline built
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Map ready
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Budget calculated
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Trip saved
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Upcoming Trips with Countdown */}
      {upcomingTrips.length > 0 && (
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming Trips
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingTrips.map((trip) => {
              const daysUntil = getDaysUntil(trip.start_date);
              return (
                <Card
                  key={trip.id}
                  className="group cursor-pointer border-border/50 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getDestinationEmoji(trip.destination)}</span>
                          <CardTitle className="text-lg">{trip.destination}</CardTitle>
                        </div>
                        {trip.start_date && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Date(trip.start_date).toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <span className="flex items-center gap-2 text-foreground">
                        <span className="text-lg font-bold">
                          {trip.duration}
                        </span>
                        <span className="text-xs text-muted-foreground">days</span>
                      </span>
                    </div>

                    {/* Countdown */}
                    {daysUntil !== null && daysUntil > 0 && (
                      <div className="mb-4 rounded-xl bg-primary/5 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Starts in</span>
                          <span className="text-2xl font-bold text-primary">
                            {daysUntil > 365
                              ? `${Math.floor(daysUntil / 365)}y`
                              : daysUntil > 30
                              ? `${Math.floor(daysUntil / 30)}mo`
                              : `${daysUntil}d`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Quick info */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Wallet className="h-3.5 w-3.5" />
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: trip.currency || 'USD',
                          minimumFractionDigits: 0,
                        }).format(trip.budget)}
                      </span>
                      {trip.interests && trip.interests.length > 0 && (
                        <div className="flex gap-1">
                          {trip.interests.slice(0, 2).map((interest) => {
                            const Icon = getInterestIcon(interest);
                            return (
                              <div
                                key={interest}
                                className="rounded-full bg-accent p-1.5"
                                title={interest}
                              >
                                <Icon className="h-3 w-3 text-muted-foreground" />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Active / Current Trip */}
      {activeTrips.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Currently Traveling
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeTrips.map((trip) => {
              const progress = getTripProgress(trip.start_date, trip.end_date);
              return (
                <Card
                  key={trip.id}
                  className="cursor-pointer border-emerald-500/20 transition-all duration-200 hover:shadow-md"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-2xl">{getDestinationEmoji(trip.destination)}</span>
                      <div>
                        <CardTitle className="text-lg">{trip.destination}</CardTitle>
                        <p className="text-sm text-emerald-500">Live Trip</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-emerald-500">{progress}%</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Saved Places Preview */}
      {places.length > 0 && (
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Bookmark className="h-5 w-5 text-amber-500" />
              Saved Places
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-sm"
              onClick={() => setActiveSection('saved-places')}
            >
              View all <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {places.slice(0, 8).map((place) => (
              <button
                key={place.id}
                className="flex-shrink-0 cursor-pointer text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => navigate(`/planner?destination=${encodeURIComponent(place.name)}`)}
              >
                <div className="flex h-24 w-32 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                  <div className="text-center">
                    <div className="text-2xl">
                      {place.place_type === 'restaurant' ? '🍽️' :
                       place.place_type === 'cafe' ? '☕' :
                       place.place_type === 'hotel' ? '🏨' :
                       place.place_type === 'beach' ? '🏖️' :
                       place.place_type === 'viewpoint' ? '🌄' :
                       place.place_type === 'museum' ? '🏛️' :
                       place.place_type === 'park' ? '🌳' :
                       place.place_type === 'shopping' ? '🛍️' :
                       place.place_type === 'nightlife' ? '🌙' : '📍'}
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-foreground max-w-[7rem] px-1">
                      {place.name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Destinations */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Stars className="h-5 w-5 text-amber-400" />
            Recommended for You
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-sm"
            onClick={() => navigate('/recommendations')}
          >
            Explore all <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RECOMMENDED_DESTINATIONS.map((dest) => (
            <Card
              key={dest.name}
              className="group cursor-pointer border-border/50 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
              onClick={() => navigate(`/planner?destination=${encodeURIComponent(dest.name)}`)}
            >
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-3xl">{dest.emoji}</span>
                  <Badge variant="secondary" className="text-xs">
                    {dest.temp}
                  </Badge>
                </div>
                <CardTitle className="mb-1 text-base">{dest.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{dest.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Your Travel Profile Card */}
      {profile && profile.onboarding_completed && !profileLoading && (
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Your Travel Profile</h2>
          </div>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-3">
                {profile.travel_style && profile.travel_style.length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2">
                    <Compass className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{profile.travel_style.join(', ')}</span>
                  </div>
                )}
                {profile.pace && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 px-3 py-2">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm capitalize text-foreground">{profile.pace} pace</span>
                  </div>
                )}
                {profile.budget_range && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 px-3 py-2">
                    <Wallet className="h-4 w-4 text-amber-500" />
                    <span className="text-sm capitalize text-foreground">{profile.budget_range}</span>
                  </div>
                )}
                {profile.companion_preference && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-500/5 px-3 py-2">
                    <Users className="h-4 w-4 text-rose-500" />
                    <span className="text-sm capitalize text-foreground">{profile.companion_preference}</span>
                  </div>
                )}
                {profile.accommodation_preference && (
                  <div className="flex items-center gap-2 rounded-xl bg-violet-500/5 px-3 py-2">
                    <Bed className="h-4 w-4 text-violet-500" />
                    <span className="text-sm capitalize text-foreground">{profile.accommodation_preference}</span>
                  </div>
                )}
                {profile.transport_preferences && profile.transport_preferences.length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-blue-500/5 px-3 py-2">
                    <Train className="h-4 w-4 text-blue-500" />
                    <span className="text-sm capitalize text-foreground">{profile.transport_preferences.join(', ')}</span>
                  </div>
                )}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-orange-500/5 px-3 py-2">
                    <Mountain className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-foreground">{profile.interests.slice(0, 4).join(', ')}{profile.interests.length > 4 ? '…' : ''}</span>
                  </div>
                )}
                {profile.food_preferences && profile.food_preferences.length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-green-500/5 px-3 py-2">
                    <Salad className="h-4 w-4 text-green-500" />
                    <span className="text-sm capitalize text-foreground">{profile.food_preferences.join(', ')}</span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                These preferences are used to personalize every recommendation and itinerary.
                <button
                  onClick={() => navigate('/onboarding')}
                  className="ml-1 cursor-pointer font-medium text-primary underline-offset-2 hover:underline"
                >
                  Update
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Existing Trips Grid */}
      <div id="your-trips">
        <div className="mb-8 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Luggage className="h-5 w-5 text-primary" />
          {profile?.travel_style && profile.travel_style.length > 0
            ? `${profile.travel_style[0]} Trips`
            : 'Your Trips'}
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate('/planner')}
        >
          <Plus className="h-4 w-4" />
          New Trip
        </Button>
      </div>

      {tripsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center py-12">
            <MapPin className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground">
              No trips yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start planning your first adventure with AI
            </p>
            <Button className="mt-4" onClick={() => navigate('/planner')}>
              Plan Your First Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip, i) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="group cursor-pointer border-border/50 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getDestinationEmoji(trip.destination)}</span>
                      <CardTitle className="text-base">
                        {trip.destination}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {trip.duration} days
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {trip.start_date
                        ? new Date(trip.start_date).toLocaleDateString()
                        : 'Flexible'}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: trip.currency || 'USD',
                        minimumFractionDigits: 0,
                      }).format(trip.budget)}
                    </span>
                  </div>
                  {/* Progress bar for past/active trips */}
                  {trip.start_date && trip.end_date && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                        style={{
                          width: `${Math.min(100, getTripProgress(trip.start_date, trip.end_date))}%`,
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </motion.div>
  );
}