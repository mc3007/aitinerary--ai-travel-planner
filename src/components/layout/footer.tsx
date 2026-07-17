import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Map,
  Compass,
  Heart,
  Briefcase,
  Bell,
  LifeBuoy,
  User,
  MessageSquare,
} from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Changelog', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Resources: [
    { label: 'Guides', href: '#' },
    { label: 'Support', href: '#' },
    { label: 'Feedback', href: '/feedback' },
  ],
  Legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

export function Footer() {
  const { user } = useAuth();

  const appLinks = [
    { label: 'Planner', href: '/planner', icon: Map },
    { label: 'Recommendations', href: '/recommendations', icon: Compass },
    { label: 'Saved Places', href: '/saved-places', icon: Heart },
    { label: 'My Trips', href: '/dashboard', icon: Briefcase },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Support', href: '#', icon: LifeBuoy },
    { label: 'Feedback', href: '/feedback', icon: MessageSquare },
  ];

  const accountLinks = [
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center">
              <img
                src="/logo-full.png"
                alt="AITinerary"
                className="h-7 w-auto"
              />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              {user
                ? 'Welcome back. Plan, save, and explore your next trip.'
                : 'Your AI-powered travel companion. Plan smarter, travel better.'}
            </p>
          </div>

          {user ? (
            <>
              <div>
                <h3 className="text-sm font-semibold text-foreground">App</h3>
                <ul className="mt-3 space-y-2">
                  {appLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Account</h3>
                <ul className="mt-3 space-y-2">
                  {accountLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Legal</h3>
                <ul className="mt-3 space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Terms
                    </a>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-foreground">{category}</h3>
                <ul className="mt-3 space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
        <div className="mt-12 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AITinerary. All rights reserved.
        </div>
      </div>
    </footer>
  );
}