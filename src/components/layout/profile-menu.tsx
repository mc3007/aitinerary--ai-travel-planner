import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  Bookmark,
  Compass,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useTrips';

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

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

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || '?';

  const menuItems = [
    {
      label: 'Travel Profile',
      icon: User,
      action: () => { navigate('/profile'); setOpen(false); },
    },
    {
      label: 'Saved Places',
      icon: Bookmark,
      badge: null as string | null,
      action: () => { navigate('/saved-places'); setOpen(false); },
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => { navigate('/settings'); setOpen(false); },
    },
  ];

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer rounded-full transition-all duration-200 hover:ring-2 hover:ring-primary/30 active:scale-95"
        aria-label="User menu"
        aria-expanded={open}
        aria-controls="profile-menu"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="profile-menu"
            role="menu"
            aria-label="User menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl"
          >
            {/* User info */}
            <div className="border-b border-border/30 px-4 py-3">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile?.name || user?.email?.split('@')[0] || 'Traveler'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>

            {/* Menu items */}
            <div className="py-1" role="none">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  role="menuitem"
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                </button>
              ))}
            </div>

            {/* Sign out */}
            <div className="border-t border-border/30 py-1">
              <button
                onClick={handleSignOut}
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}