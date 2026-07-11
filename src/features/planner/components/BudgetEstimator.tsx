import { Sliders } from 'lucide-react';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';

interface BudgetEstimatorProps {
  totalBudget?: number;
  allocation: {
    accommodation?: number;
    dining?: number;
    commute?: number;
    activities?: number;
    miscellaneous?: number;
  };
  onChange: (allocation: {
    accommodation?: number;
    dining?: number;
    commute?: number;
    activities?: number;
    miscellaneous?: number;
  }) => void;
  estimated?: {
    accommodation: number;
    dining: number;
    commute: number;
    activities: number;
    miscellaneous: number;
  };
}

const BUDGET_CATEGORIES = [
  { key: 'accommodation', label: 'Accommodation 🏨', defaultPercent: 40 },
  { key: 'dining', label: 'Dining 🍽️', defaultPercent: 25 },
  { key: 'commute', label: 'Commute 🚗', defaultPercent: 15 },
  { key: 'activities', label: 'Activities 🎯', defaultPercent: 15 },
  { key: 'miscellaneous', label: 'Miscellaneous 🎒', defaultPercent: 5 },
] as const;

export function BudgetEstimator({ totalBudget, allocation, onChange, estimated }: BudgetEstimatorProps) {
  const handleChange = (key: string, value: string) => {
    const num = value === '' ? undefined : Number(value);
    onChange({ ...allocation, [key]: num });
  };

  const getSuggestedAmount = (key: string): number | undefined => {
    if (!totalBudget) return undefined;
    const category = BUDGET_CATEGORIES.find(c => c.key === key);
    if (!category) return undefined;
    return Math.round((totalBudget * category.defaultPercent) / 100);
  };

  const remaining =
    totalBudget &&
    BUDGET_CATEGORIES.reduce((acc, { key }) => {
      const val = allocation[key as keyof typeof allocation] ?? 0;
      return acc - val;
    }, totalBudget);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        <Sliders className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">Budget Breakdown</Label>
        <span className="text-xs text-muted-foreground font-normal">(optional)</span>
      </div>

      <div className="space-y-3">
        {BUDGET_CATEGORIES.map(({ key, label }) => {
          const value = allocation[key as keyof typeof allocation];
          const suggested = getSuggestedAmount(key);
          const estimatedVal = estimated?.[key as keyof typeof estimated];
          const displayValue = estimatedVal ?? value ?? '';

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                {suggested && !value && (
                  <button
                    type="button"
                    className="text-[10px] text-primary/60 hover:text-primary transition-colors"
                    onClick={() => handleChange(key, String(suggested))}
                  >
                    Suggest: {suggested}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder={estimatedVal ? `AI estimated ~${estimatedVal}` : 'Enter amount'}
                  value={displayValue || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="h-8 text-xs"
                />
                {estimatedVal !== undefined && (
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">
                    AI: ~{estimatedVal}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalBudget && (
        <div className="rounded-lg border border-border/50 bg-card/50 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total budget</span>
            <span className="font-medium text-foreground">${totalBudget}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">Allocated</span>
            <span className="font-medium">
              ${totalBudget - (remaining ?? totalBudget)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">Remaining</span>
            <span className={`font-medium ${(remaining ?? 0) < 0 ? 'text-destructive' : 'text-green-500'}`}>
              ${remaining ?? totalBudget}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}