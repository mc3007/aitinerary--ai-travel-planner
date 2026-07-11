import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  MapPin,
  Calendar,
  TrendingUp,
  Compass,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useTrips } from '../../hooks/useTrips';
import { useEffect } from 'react';

export function DashboardPage() {
  const { user } = useAuth();
  const { trips, isLoading } = useTrips();
  const navigate = useNavigate();

  // If no name set, redirect to onboarding
  useEffect(() => {}, []);

  const quickActions = [
    {
      label: 'New Trip',
      icon: Plus,
      action: () => navigate('/planner'),
      gradient: 'from-primary to-secondary',
    },
    {
      label: 'Explore',
      icon: Compass,
      action: () => navigate('/planner'),
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      label: 'AI Chat',
      icon: Sparkles,
      action: () => navigate('/planner'),
      gradient: 'from-amber-400 to-orange-500',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ready to plan your next adventure?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {quickActions.map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <button
              onClick={action.action}
              className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card p-6 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            >
              <div
                className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${action.gradient} p-3`}
              >
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {action.label}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {action.label === 'New Trip'
                  ? 'Create a new AI-powered itinerary'
                  : action.label === 'Explore'
                  ? 'Discover trending destinations'
                  : 'Ask your AI travel companion'}
              </p>
              <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Trips Section */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Your Trips</h2>
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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
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
            <Button
              className="mt-4"
              onClick={() => navigate('/planner')}
            >
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
                className="cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-md"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      {trip.destination}
                    </CardTitle>
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}