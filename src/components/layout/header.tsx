import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { ProfileMenu } from './profile-menu';
import { ThemeToggle } from './theme-toggle';
import { NotificationCenter } from '../../features/notifications/notification-center';
import { Luggage, Plus, Menu, X, Compass, Bot, Sparkles } from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  sectionId?: string;
};

const LANDING_NAV: NavItem[] = [
  { label: 'Features', href: '#features', icon: Compass },
  { label: 'FAQ', href: '#faq', icon: Bot },
];

const SIGNED_IN_NAV: NavItem[] = [
  {
    label: 'New Trip',
    href: '/dashboard',
    icon: Plus,
    sectionId: 'quick-actions',
  },
  {
    label: 'AI Recommendations',
    href: '/recommendations',
    icon: Sparkles,
  },
  {
    label: 'My Trips',
    href: '/dashboard',
    icon: Luggage,
    sectionId: 'your-trips',
  },
];

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = user ? SIGNED_IN_NAV : LANDING_NAV;

  // Track scroll state for glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Helper function to scroll with a custom offset for the fixed header
  const scrollToElementWithOffset = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 100; // Adjust this value if you need more/less space above the buttons
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Handle hash navigation — scroll to section after page loads
  useEffect(() => {
    if (location.hash && location.pathname === '/dashboard') {
      const id = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        scrollToElementWithOffset(id);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  const handleNavClick = (item: NavItem) => {
    if (user && item.sectionId) {
      // Already on dashboard → scroll with offset
      if (location.pathname === '/dashboard') {
        scrollToElementWithOffset(item.sectionId);
        return;
      }
      // Navigate to dashboard with hash
      navigate(`/dashboard#${item.sectionId}`);
    } else if (!user && item.href.startsWith('#')) {
      // Landing page hash scroll with offset
      scrollToElementWithOffset(item.href.slice(1));
    } else {
      // Standard page navigation (e.g., AI Recommendations)
      navigate(item.href);
      // Force scroll to absolute top immediately so it doesn't load halfway down the page
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl backdrop-saturate-150 shadow-lg shadow-black/5'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <button
          onClick={() => {
            navigate(user ? '/dashboard' : '/');
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }}
          className="flex cursor-pointer items-center transition-opacity hover:opacity-80"
          aria-label="Home"
        >
          <img
            src="/logo-full.png"
            alt="AITinerary"
            className={`w-auto transition-all duration-300 ${
              scrolled ? 'h-6' : 'h-7'
            }`}
          />
        </button>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className="group flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user && <NotificationCenter />}

          {user ? (
            <ProfileMenu />
          ) : (
            <button
              onClick={() => {
                navigate('/login');
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97]"
            >
              Sign In
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="ml-1 cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/30 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <nav className="space-y-1 px-4 py-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    handleNavClick(item);
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  {item.label}
                </button>
              ))}
              {!user && (
                <button
                  onClick={() => {
                    navigate('/signup');
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    setMobileMenuOpen(false);
                  }}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-on-primary transition-all hover:bg-primary/90 active:scale-[0.97]"
                >
                  Get Started
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}