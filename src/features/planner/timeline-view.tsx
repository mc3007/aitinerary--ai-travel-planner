import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Coffee,
  Moon,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { useState } from 'react';
import type { DayPlan, Activity } from '../../types/itinerary';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';

interface ItineraryTimelineProps {
  days: DayPlan[];
  currency: string;
}

const categoryConfig = {
  morning: {
    icon: Sun,
    label: 'Morning',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  afternoon: {
    icon: Coffee,
    label: 'Afternoon',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  evening: {
    icon: Moon,
    label: 'Evening',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
};

function ActivityCard({ activity, currency }: { activity: Activity; currency: string }) {
  const [expanded, setExpanded] = useState(false);
  const config = categoryConfig[activity.category];

  return (
    <motion.div
      layout
      className="rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-primary/20"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-4 p-4 text-left cursor-pointer"
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
          <config.icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
              <h4 className="mt-0.5 text-sm font-semibold text-foreground">
                {activity.title}
              </h4>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-primary">
                {formatCurrency(activity.estimatedCost, currency)}
              </span>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-4 pb-4 pt-3">
              <p className="text-sm text-muted-foreground">
                {activity.description}
              </p>
              {activity.tips && (
                <div className="mt-2 rounded-lg bg-primary/5 px-3 py-2">
                  <p className="text-xs text-primary">
                    <span className="font-semibold">Tip:</span> {activity.tips}
                  </p>
                </div>
              )}
              {activity.location && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {activity.location.name}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ItineraryTimeline({ days, currency }: ItineraryTimelineProps) {
  const [activeDay, setActiveDay] = useState(0);
  const currentDay = days[activeDay];

  if (!days.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No itinerary yet
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in your details and generate an AI itinerary
        </p>
      </div>
    );
  }

  const totalCost = currentDay?.activities.reduce(
    (sum, a) => sum + a.estimatedCost,
    0
  );

  return (
    <div className="space-y-6">
      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {days.map((day, i) => (
          <button
            key={day.day}
            onClick={() => setActiveDay(i)}
            className={`cursor-pointer shrink-0 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
              i === activeDay
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <p className="text-xs text-muted-foreground">Day {day.day}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {day.date}
            </p>
          </button>
        ))}
      </div>

      {/* Day summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Day {currentDay?.day}
          </h3>
          <p className="text-sm text-muted-foreground">{currentDay?.date}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(totalCost || 0, currency)}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {currentDay?.activities.length} activities
          </Badge>
        </div>
      </div>

      {/* Activities */}
      <ScrollArea className="max-h-[500px] pr-2">
        <div className="space-y-3">
          {currentDay?.activities.map((activity, i) => (
            <ActivityCard
              key={i}
              activity={activity}
              currency={currency}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}