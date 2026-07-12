import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, GripVertical, MapPin } from 'lucide-react';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { LocationAutocomplete } from '../../../components/ui/autocomplete';
import type { GeoLocation } from '../../../lib/geocoding';
import { detectCurrencyFromDestination, type CurrencyInfo } from '../../../lib/currency';

export interface DestinationEntry {
  name: string;
  lat?: number;
  lng?: number;
  countryCode?: string;
  currency?: CurrencyInfo;
  nights?: number;
}

interface DestinationListProps {
  destinations: string[];
  onChange: (destinations: string[]) => void;
  onDestinationDetails?: (details: DestinationEntry[]) => void;
  errors?: string[];
}

export function DestinationList({
  destinations,
  onChange,
  onDestinationDetails,
  errors,
}: DestinationListProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
  const [destinationDetails, setDestinationDetails] = useState<DestinationEntry[]>([]);

  const addDestination = (location?: GeoLocation) => {
    const loc = location || selectedLocation;
    const name = loc ? loc.displayName : inputValue.trim();
    if (!name || destinations.includes(name)) return;

    onChange([...destinations, name]);

    const entry: DestinationEntry = {
      name,
      lat: loc?.lat,
      lng: loc?.lng,
      countryCode: loc?.countryCode,
      nights: 1,
      currency: loc?.countryCode
        ? detectCurrencyFromDestination(loc.name) || detectCurrencyFromDestination(loc.country)
        : detectCurrencyFromDestination(name),
    };

    const newDetails = [...destinationDetails, entry];
    setDestinationDetails(newDetails);
    onDestinationDetails?.(newDetails);

    setInputValue('');
    setSelectedLocation(null);
  };

  const removeDestination = (index: number) => {
    onChange(destinations.filter((_, i) => i !== index));
    const newDetails = destinationDetails.filter((_, i) => i !== index);
    setDestinationDetails(newDetails);
    onDestinationDetails?.(newDetails);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDestination();
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5 text-sm font-medium">
        <MapPin className="h-4 w-4 text-primary" />
        Destinations
        <span className="text-xs text-muted-foreground font-normal">
          (add 2+ for multi-city route planning)
        </span>
      </Label>

      {/* Add destination input */}
      <div className="flex gap-2">
        <LocationAutocomplete
          value={inputValue}
          onChange={(val, loc) => {
            setInputValue(val);
            if (loc) setSelectedLocation(loc);
          }}
          onSelect={(loc) => {
            setSelectedLocation(loc);
            setInputValue(loc.displayName);
            // Immediately add the destination when a suggestion is selected
            addDestination(loc);
          }}
          placeholder="Enter a city or region..."
          className="flex-1"
        />
        <Button
          type="button"
          onClick={() => addDestination()}
          disabled={!inputValue.trim()}
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Destination list */}
      <AnimatePresence>
        <div className="space-y-2">
          {destinations.map((dest, index) => {
            const details = destinationDetails[index];
            return (
              <motion.div
                key={dest}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground block truncate">
                    {dest}
                  </span>
                  {details?.currency && (
                    <span className="text-[10px] text-muted-foreground">
                      {details.currency.code} {details.currency.symbol}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeDestination(index)}
                  className="cursor-pointer rounded-full p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {destinations.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Start typing a city name and select from suggestions or press Enter to add it
        </p>
      )}

      {errors?.map((err, i) => (
        <p key={i} className="text-xs text-destructive">
          {err}
        </p>
      ))}
    </div>
  );
}