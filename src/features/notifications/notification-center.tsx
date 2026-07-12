import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  CheckCheck,
  Calendar,
  Plane,
  ScrollText,
  CloudSun,
  Wallet,
  UtensilsCrossed,
  Sparkles,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  trip_reminder: Calendar,
  passport: ScrollText,
  visa: Plane,
  weather_alert: CloudSun,
  budget_exceeded: Wallet,
  restaurant_reservation: UtensilsCrossed,
  ai_suggestion: Sparkles,
  flight_alert: Plane,
  booking_reminder: Calendar,
  generic: AlertCircle,
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification } = useNotifications();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const recentNotifications = notifications.slice(0, 20);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-controls="notification-panel"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white animate-fade-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="notification-panel"
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead.mutate()}
                    className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    title="Mark all as read"
                    aria-label="Mark all notifications as read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div
              className="max-h-80 overflow-y-auto"
              role="listbox"
              aria-label="Notification list"
            >
              {recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Bell className="mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-foreground">All clear!</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    No notifications yet. We'll let you know when something important comes up.
                  </p>
                </div>
              ) : (
                recentNotifications.map((notif) => {
                  const Icon = NOTIFICATION_ICONS[notif.type] || AlertCircle;
                  return (
                    <div
                      key={notif.id}
                      role="option"
                      aria-selected={false}
                      className={cn(
                        'group flex items-start gap-3 border-b border-border/20 px-4 py-3 transition-colors hover:bg-muted/50',
                        !notif.read && 'bg-primary/[0.02]'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                          !notif.read ? 'bg-primary/10' : 'bg-muted'
                        )}
                      >
                        <Icon className={cn('h-4 w-4', !notif.read ? 'text-primary' : 'text-muted-foreground')} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              'text-sm leading-snug',
                              !notif.read ? 'font-medium text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            {notif.title}
                          </p>
                          <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                            {getTimeAgo(notif.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {notif.message}
                        </p>

                        {/* Actions */}
                        <div className="mt-2 flex items-center gap-2">
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead.mutate(notif.id)}
                              className="cursor-pointer text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                            >
                              Mark read
                            </button>
                          )}
                          {notif.actionable && notif.action_url && (
                            <a
                              href={notif.action_url}
                              className="text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                            >
                              {notif.action_label || 'View'}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={() => dismissNotification.mutate(notif.id)}
                        className="flex-shrink-0 cursor-pointer rounded-lg p-1 text-muted-foreground/40 opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
                        aria-label="Dismiss notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {recentNotifications.length > 0 && (
              <div className="border-t border-border/30 px-4 py-2.5">
                <button
                  onClick={() => {
                    markAllAsRead.mutate();
                    setOpen(false);
                  }}
                  className="w-full cursor-pointer rounded-lg px-3 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Mark all as read & close
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}