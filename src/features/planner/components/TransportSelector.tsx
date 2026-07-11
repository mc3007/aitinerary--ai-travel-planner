import { motion } from 'framer-motion';
import { Train, Car, Plane, Ship, Bus, Bike, Footprints } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { TRANSPORT_MODES, type TransportMode } from '../../../types/itinerary';

interface TransportSelectorProps {
  selected: string[];
  onChange: (modes: string[]) => void;
  editable?: boolean;
}

const modeIcons: Record<string, React.ReactNode> = {
  walking: <Footprints className="h-4 w-4" />,
  bicycle: <Bike className="h-4 w-4" />,
  bus: <Bus className="h-4 w-4" />,
  train: <Train className="h-4 w-4" />,
  car: <Car className="h-4 w-4" />,
  flight: <Plane className="h-4 w-4" />,
  ferry: <Ship className="h-4 w-4" />,
  rideshare: <Car className="h-4 w-4" />,
};

function getDistanceLabel(distanceKm?: number): 'short' | 'medium' | 'long' | 'all' {
  if (!distanceKm) return 'all';
  if (distanceKm < 10) return 'short';
  if (distanceKm < 300) return 'medium';
  return 'long';
}

function estimateDistance(from: string, to: string): number | undefined {
  // Rough distance estimates by city name matching
  const knownDistances: Record<string, Record<string, number>> = {
    'paris': { 'amsterdam': 500, 'london': 340, 'rome': 1100, 'berlin': 880, 'barcelona': 1040 },
    'london': { 'paris': 340, 'amsterdam': 360, 'berlin': 930, 'rome': 1430 },
    'new york': { 'boston': 310, 'washington': 360, 'chicago': 1140, 'miami': 1750, 'los angeles': 3940 },
    'tokyo': { 'osaka': 400, 'kyoto': 370, 'seoul': 1160 },
    'bangkok': { 'chiang mai': 680, 'phuket': 790, 'singapore': 1420 },
    'sydney': { 'melbourne': 710, 'brisbane': 730 },
    'amsterdam': { 'paris': 500, 'london': 360, 'berlin': 650 },
    'rome': { 'paris': 1100, 'venice': 400, 'florence': 270 },
    'barcelona': { 'madrid': 505, 'paris': 1040 },
    'berlin': { 'munich': 500, 'amsterdam': 650, 'paris': 880 },
    'mumbai': { 'delhi': 1150, 'banglore': 840, 'goa': 580 },
    'delhi': { 'mumbai': 1150, 'jaipur': 280, 'agra': 200 },
    'singapore': { 'kuala lumpur': 320, 'bangkok': 1420 },
  };

  const fromKey = from.toLowerCase().trim();
  const toKey = to.toLowerCase().trim();

  // Try both directions
  return knownDistances[fromKey]?.[toKey] ?? knownDistances[toKey]?.[fromKey];
}

function getAvailableModes(from?: string, to?: string): TransportMode[] {
  if (!from || !to) return TRANSPORT_MODES.filter(m => m.id !== 'flight');
  const dist = estimateDistance(from, to);
  const range = getDistanceLabel(dist);
  return TRANSPORT_MODES.filter(
    m => m.availableFor === range || m.availableFor === 'all'
  );
}

export function TransportSelector({ selected, onChange, editable = true }: TransportSelectorProps) {
  // For now, show all modes (when we have multi-destination, we'll filter per leg)
  const availableModes = TRANSPORT_MODES;

  const toggleMode = (modeId: string) => {
    if (!editable) return;
    if (selected.includes(modeId)) {
      onChange(selected.filter(id => id !== modeId));
    } else {
      onChange([...selected, modeId]);
    }
  };

  if (!editable && selected.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Preferred transport modes
        {editable && ' (tap to select)'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {availableModes.map((mode) => {
          const isActive = selected.includes(mode.id);
          return (
            <motion.button
              key={mode.id}
              type="button"
              onClick={() => toggleMode(mode.id)}
              whileTap={editable ? { scale: 0.95 } : undefined}
              className={
                editable
                  ? `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                    }`
                  : undefined
              }
              disabled={!editable}
            >
              {modeIcons[mode.id] || <span className="text-xs">{mode.icon}</span>}
              <span>{mode.label}</span>
              {isActive && editable && (
                <span className="ml-0.5 text-[9px] opacity-70">✓</span>
              )}
              {!editable && isActive && (
                <Badge variant="secondary" className="ml-0.5 text-[9px] px-1 py-0">
                  {mode.speedLabel}
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}