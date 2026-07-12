import { motion } from 'framer-motion';
import { Route, Compass, Bot } from 'lucide-react';

interface PlannerLandingProps {
  onPlanTrip: () => void;
  onExplore: () => void;
  onAiChat: () => void;
}

const cards = [
  {
    id: 'plan-trip',
    title: 'Plan Trip',
    description: 'Build a detailed itinerary with dates, budget, and destinations.',
    icon: Route,
    color: 'from-blue-500/10 to-indigo-500/10',
    iconColor: 'text-blue-500',
    onClick: (handlers: PlannerLandingProps) => handlers.onPlanTrip(),
  },
  {
    id: 'explore',
    title: 'Explore',
    description: 'Discover attractions, restaurants, and hidden gems on a map.',
    icon: Compass,
    color: 'from-emerald-500/10 to-teal-500/10',
    iconColor: 'text-emerald-500',
    onClick: (handlers: PlannerLandingProps) => handlers.onExplore(),
  },
  {
    id: 'ai-chat',
    title: 'AI Chat',
    description: 'Describe your dream trip in plain language and let AI fill it in.',
    icon: Bot,
    color: 'from-violet-500/10 to-purple-500/10',
    iconColor: 'text-violet-500',
    onClick: (handlers: PlannerLandingProps) => handlers.onAiChat(),
  },
];

export function PlannerLanding({ onPlanTrip, onExplore, onAiChat }: PlannerLandingProps) {
  const handlers = { onPlanTrip, onExplore, onAiChat };

  return (
    <section id="new-trip" className="scroll-mt-24">
      <div className="mb-3">
        <h2 className="text-xl font-semibold text-foreground">How would you like to start?</h2>
        <p className="text-sm text-muted-foreground">
          Choose a path and we’ll guide you from there.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.id}
              onClick={() => card.onClick(handlers)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${card.color} p-5 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
            >
              <div className={`rounded-xl bg-background/80 p-2.5 shadow-sm ${card.iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{card.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
