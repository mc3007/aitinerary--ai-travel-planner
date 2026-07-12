import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Sun,
  Coffee,
  Moon,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  Plus,
  Trash2,
  ArrowRightLeft,
  CheckCircle,
  Circle,
  Lightbulb,
  StickyNote,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { DayPlan, Activity } from '../../types/itinerary';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface ItineraryTimelineProps {
  days: DayPlan[];
  currency: string;
  homeCurrency?: string;
  exchangeRate?: number;
  onUpdate?: (days: DayPlan[]) => void;
}

const categoryConfig = {
  morning: {
    icon: Sun,
    label: 'Morning',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  afternoon: {
    icon: Coffee,
    label: 'Afternoon',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  evening: {
    icon: Moon,
    label: 'Evening',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function updateActivityInDays(
  days: DayPlan[],
  dayIndex: number,
  activityIndex: number,
  updates: Partial<Activity>,
): DayPlan[] {
  return days.map((day, di) => {
    if (di !== dayIndex) return day;
    return {
      ...day,
      activities: day.activities.map((a, ai) => (ai === activityIndex ? { ...a, ...updates } : a)),
    };
  });
}

function deleteActivityInDays(days: DayPlan[], dayIndex: number, activityIndex: number): DayPlan[] {
  return days.map((day, di) => {
    if (di !== dayIndex) return day;
    return { ...day, activities: day.activities.filter((_, ai) => ai !== activityIndex) };
  });
}

function addActivityToDay(days: DayPlan[], dayIndex: number): DayPlan[] {
  const newActivity: Activity = {
    time: '12:00',
    title: 'New Activity',
    description: '',
    category: 'afternoon',
    estimatedCost: 0,
    location: { name: '', lat: 0, lng: 0 },
    tips: '',
    notes: '',
    visited: false,
  };
  return days.map((day, di) => {
    if (di !== dayIndex) return day;
    return { ...day, activities: [...day.activities, newActivity] };
  });
}

function moveActivityToDay(
  days: DayPlan[],
  fromDay: number,
  fromIndex: number,
  toDay: number,
): DayPlan[] {
  const activity = days[fromDay].activities[fromIndex];
  return days.map((day, di) => {
    if (di === fromDay) return { ...day, activities: day.activities.filter((_, ai) => ai !== fromIndex) };
    if (di === toDay) return { ...day, activities: [...day.activities, activity] };
    return day;
  });
}

function reorderDayActivities(days: DayPlan[], dayIndex: number, activities: Activity[]): DayPlan[] {
  return days.map((day, di) => (di === dayIndex ? { ...day, activities } : day));
}

// ─── Inline Edit ─────────────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  placeholder = '',
  type = 'text',
  className = '',
  prefix = '',
}: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  className?: string;
  prefix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        {prefix && <span className="text-xs text-muted-foreground shrink-0">{prefix}</span>}
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          className={`h-7 w-full rounded border border-primary/50 bg-background px-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary ${className}`}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`cursor-pointer text-left hover:opacity-70 transition-opacity ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-muted-foreground italic">{placeholder}</span>}
    </button>
  );
}

// ─── Inline Textarea ─────────────────────────────────────────────────────────

function InlineTextarea({
  value,
  onSave,
  placeholder = '',
}: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      }
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        className="w-full resize-none rounded border border-primary/50 bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
        placeholder={placeholder}
        rows={2}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="cursor-pointer text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
      title="Click to edit"
    >
      {value || <span className="italic">{placeholder}</span>}
    </button>
  );
}

// ─── Activity Card ───────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  activityIndex,
  dayIndex,
  days,
  currency,
  homeCurrency,
  exchangeRate,
  onUpdate,
  onDelete,
  onMove,
  dragHandleProps,
}: {
  activity: Activity;
  activityIndex: number;
  dayIndex: number;
  days: DayPlan[];
  currency: string;
  homeCurrency?: string;
  exchangeRate?: number;
  onUpdate: (updates: Partial<Activity>) => void;
  onDelete: () => void;
  onMove: (toDay: number) => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const config = categoryConfig[activity.category];
  const Icon = config.icon;

  const homeCost =
    homeCurrency && exchangeRate
      ? formatCurrency(activity.estimatedCost * exchangeRate, homeCurrency)
      : null;

  return (
    <motion.div
      layout
      className={`rounded-xl border bg-card overflow-hidden transition-all duration-200 ${
        activity.visited
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-border/50 hover:border-primary/20'
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Drag handle */}
        <button
          type="button"
          className="mt-3 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Category icon */}
        <button
          type="button"
          onClick={() => {
            const categories: Activity['category'][] = ['morning', 'afternoon', 'evening'];
            const currentIdx = categories.indexOf(activity.category);
            const next = categories[(currentIdx + 1) % 3];
            onUpdate({ category: next });
          }}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bg} cursor-pointer hover:opacity-80 transition-opacity`}
          title={`${config.label} — click to cycle`}
          aria-label={`Category: ${config.label}. Click to change.`}
        >
          <Icon className={`h-5 w-5 ${config.color}`} />
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <InlineEdit
              value={activity.time}
              onSave={(time) => onUpdate({ time })}
              placeholder="12:00"
              className="text-xs font-mono text-muted-foreground w-12"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <InlineEdit
              value={activity.title}
              onSave={(title) => onUpdate({ title: title || 'Untitled' })}
              placeholder="Activity title"
              className="text-sm font-semibold text-foreground flex-1 truncate"
            />
          </div>

          {/* Cost + visited toggle row */}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <DollarSign className="h-3 w-3 text-primary" />
              <InlineEdit
                value={activity.estimatedCost === 0 ? '' : String(activity.estimatedCost)}
                onSave={(val) => onUpdate({ estimatedCost: Number(val) || 0 })}
                placeholder="0"
                type="number"
                className="text-xs font-medium text-primary w-16"
                prefix={currency}
              />
              {homeCost && (
                <span className="text-xs text-muted-foreground">(~{homeCost})</span>
              )}
            </div>

            {/* Visited toggle */}
            <button
              type="button"
              onClick={() => onUpdate({ visited: !activity.visited })}
              className={`cursor-pointer inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all duration-200 ${
                activity.visited
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              aria-label={activity.visited ? 'Mark as not visited' : 'Mark as visited'}
            >
              {activity.visited ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              {activity.visited ? 'Visited' : 'Not visited'}
            </button>
          </div>
        </div>

        {/* Actions column */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Move to day */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Move to another day"
              aria-label="Move to another day"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {showMoveMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-card p-1 shadow-lg"
                >
                  <p className="px-2 py-1 text-xs text-muted-foreground">Move to day:</p>
                  {days.map((day, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onMove(i);
                        setShowMoveMenu(false);
                      }}
                      disabled={i === dayIndex}
                      className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                        i === dayIndex
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      Day {day.day} — {day.date}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onDelete}
                className="cursor-pointer rounded-md px-1.5 py-1 text-xs font-medium text-white bg-destructive hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="cursor-pointer rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete activity"
              aria-label="Delete activity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
              {/* Description */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                <InlineTextarea
                  value={activity.description}
                  onSave={(desc) => onUpdate({ description: desc })}
                  placeholder="Add a description…"
                />
              </div>

              {/* Location */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Location</p>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <InlineEdit
                    value={activity.location?.name || ''}
                    onSave={(name) =>
                      onUpdate({
                        location: { ...activity.location, name, lat: activity.location?.lat || 0, lng: activity.location?.lng || 0 },
                      })
                    }
                    placeholder="Add location…"
                    className="text-sm text-muted-foreground"
                  />
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-lg bg-primary/5 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-medium text-primary">Tips</p>
                </div>
                <InlineTextarea
                  value={activity.tips || ''}
                  onSave={(tips) => onUpdate({ tips })}
                  placeholder="Add a tip…"
                />
              </div>

              {/* Notes */}
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                </div>
                <InlineTextarea
                  value={activity.notes || ''}
                  onSave={(notes) => onUpdate({ notes })}
                  placeholder="Add personal notes…"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Timeline ───────────────────────────────────────────────────────────

export function ItineraryTimeline({
  days,
  currency,
  homeCurrency,
  exchangeRate,
  onUpdate,
}: ItineraryTimelineProps) {
  const [activeDay, setActiveDay] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentDay = days[activeDay];

  // Scroll active day tab into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const tab = el.children[activeDay] as HTMLElement | undefined;
    if (tab) {
      tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeDay]);

  const handleUpdate = useCallback(
    (activityIndex: number, updates: Partial<Activity>) => {
      if (!onUpdate) return;
      onUpdate(updateActivityInDays(days, activeDay, activityIndex, updates));
    },
    [days, activeDay, onUpdate],
  );

  const handleDelete = useCallback(
    (activityIndex: number) => {
      if (!onUpdate) return;
      onUpdate(deleteActivityInDays(days, activeDay, activityIndex));
    },
    [days, activeDay, onUpdate],
  );

  const handleMove = useCallback(
    (fromIndex: number, toDay: number) => {
      if (!onUpdate) return;
      onUpdate(moveActivityToDay(days, activeDay, fromIndex, toDay));
    },
    [days, activeDay, onUpdate],
  );

  const handleAdd = useCallback(() => {
    if (!onUpdate) return;
    onUpdate(addActivityToDay(days, activeDay));
  }, [days, activeDay, onUpdate]);

  const handleReorder = useCallback(
    (activities: Activity[]) => {
      if (!onUpdate) return;
      onUpdate(reorderDayActivities(days, activeDay, activities));
    },
    [days, activeDay, onUpdate],
  );

  const totalCost = currentDay?.activities.reduce((sum, a) => sum + a.estimatedCost, 0) || 0;
  const homeTotalCost =
    homeCurrency && exchangeRate ? formatCurrency(totalCost * exchangeRate, homeCurrency) : null;

  if (!days.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">No itinerary yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in your details and generate an AI itinerary
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveDay(Math.max(0, activeDay - 1))}
          disabled={activeDay === 0}
          className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-none flex-1 px-1"
        >
          {days.map((day, i) => (
            <button
              key={day.day}
              type="button"
              onClick={() => setActiveDay(i)}
              className={`cursor-pointer shrink-0 rounded-xl border px-4 py-2.5 text-left transition-all duration-200 ${
                i === activeDay
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <p className="text-xs text-muted-foreground">Day {day.day}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground whitespace-nowrap">
                {day.date}
              </p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setActiveDay(Math.min(days.length - 1, activeDay + 1))}
          disabled={activeDay === days.length - 1}
          className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Day {currentDay?.day}</h3>
          <p className="text-sm text-muted-foreground">{currentDay?.date}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(totalCost, currency)}
            {homeTotalCost && (
              <span className="opacity-60 ml-1">(~{homeTotalCost})</span>
            )}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {currentDay?.activities.length || 0} activities
          </Badge>
        </div>
      </div>

      {/* Activities list */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
        {currentDay?.activities.length ? (
          <Reorder.Group
            axis="y"
            values={currentDay.activities}
            onReorder={handleReorder}
            className="space-y-2"
          >
            <AnimatePresence mode="popLayout">
              {currentDay.activities.map((activity, i) => (
                <Reorder.Item key={i} value={activity} className="list-none">
                  <ActivityCard
                    activity={activity}
                    activityIndex={i}
                    dayIndex={activeDay}
                    days={days}
                    currency={currency}
                    homeCurrency={homeCurrency}
                    exchangeRate={exchangeRate}
                    onUpdate={(updates) => handleUpdate(i, updates)}
                    onDelete={() => handleDelete(i)}
                    onMove={(toDay) => handleMove(i, toDay)}
                    dragHandleProps={{ onPointerDown: (e: React.PointerEvent) => e.stopPropagation() }}
                  />
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-border/50">
            <Coffee className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No activities planned for this day</p>
            <p className="text-xs text-muted-foreground/70">
              Click the button below to add your first activity
            </p>
          </div>
        )}
      </div>

      {/* Add activity button */}
      <Button
        variant="outline"
        className="w-full cursor-pointer gap-2 border-dashed hover:border-primary/50 hover:text-primary transition-all duration-200"
        onClick={handleAdd}
      >
        <Plus className="h-4 w-4" />
        Add Activity
      </Button>
    </div>
  );
}