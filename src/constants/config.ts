import { Database } from '../types/database';

// Edge Function URL for AI itinerary generation
// Calls Fireworks AI (AMD GPU) with Natively AI fallback
export const AI_CONFIG = {
  edgeFunctionUrl: `${import.meta.env.VITE_SUPABASE_URL || 'https://ydrinzubpvfpgelwvrkd.supabase.co'}/functions/v1/generate-itinerary`,
  providers: {
    fireworks: {
      id: 'fireworks' as const,
      name: 'Fireworks AI',
      description: 'Llama 70B on AMD GPUs (fast & cost-effective)',
      badge: 'Powered by Fireworks 🚀',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
      color: '#f59e0b',
      icon: '🚀',
    },
    natively: {
      id: 'natively' as const,
      name: 'Natively AI',
      description: 'GPT-4o (accurate, reliable fallback)',
      badge: 'Powered by Natively ✨',
      badgeColor: 'bg-gradient-to-r from-purple-500 to-blue-500',
      color: '#8b5cf6',
      icon: '✨',
    },
  },
};

export const SUPABASE_CONFIG = {
  url: 'https://ydrinzubpvfpgelwvrkd.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkcmluenVicHZmcGdlbHd2cmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODAxOTUsImV4cCI6MjA5OTM1NjE5NX0.Nd4cOstgwA0T5qpcobM8HDkMnCXkrWQeG1w7-6xiTCQ',
};

export const SITE_CONFIG = {
  name: 'AITinerary',
  tagline: 'From Inspiration to Itinerary in Seconds',
  description:
    'Turn your travel dreams into personalized itineraries. AI-powered planning that understands your style, budget, and interests.',
  url: 'https://aitinerary.app',
};

export const FEATURES = [
  {
    title: 'AI Trip Planning',
    description:
      'Describe your dream trip in plain language and let AI craft a perfect day-by-day itinerary tailored to your preferences.',
    icon: 'Sparkles',
  },
  {
    title: 'Hidden Gems',
    description:
      'Discover non-touristy places, scenic routes, and local secrets that typical travel guides miss.',
    icon: 'Compass',
  },
  {
    title: 'Budget Planner',
    description:
      'Track every expense with visual charts. Get savings suggestions and never overspend on your trip.',
    icon: 'Wallet',
  },
  {
    title: 'Expense Split',
    description:
      'Traveling with friends? Split costs, track shared expenses, and auto-settle at trip end.',
    icon: 'Users',
  },
  {
    title: 'Travel Companion',
    description:
      'Ask your AI companion anything — from local food recommendations to real-time itinerary adjustments.',
    icon: 'Bot',
  },
  {
    title: 'Social Media Planner',
    description:
      'Paste an Instagram Reel or YouTube video and let AI extract locations to build your trip.',
    icon: 'Link',
  },
];

// Commented out — real testimonials will be added once we have genuine user feedback
// export const TESTIMONIALS = [
//   {
//     name: 'Sarah Chen',
//     role: 'Solo Traveler',
//     avatar: 'SC',
//     content:
//       'AITinerary saved me hours of research. I just said "I have 5 days and love photography" and got a perfect Kyoto itinerary.',
//   },
//   ...
// ];

export const FAQS = [
  {
    question: 'How does AITinerary work?',
    answer:
      'Simply tell us your destination, budget, and preferences. Our AI analyzes your inputs and generates a complete day-by-day itinerary with activities, costs, and local tips.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'Absolutely. We use industry-standard encryption and never share your personal information. Your travel plans are private to you.',
  },
  {
    question: 'Can I plan trips with friends?',
    answer:
      'Yes! The expense split feature lets you share costs and settle up with travel companions. Collaborative trip planning is coming soon.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'You need a free account to save trips and access AI features. Sign up takes less than a minute.',
  },
  {
    question: 'Can I use AITinerary offline?',
    answer:
      'Currently, an internet connection is required for AI generation. However, saved itineraries are cached for offline viewing on mobile.',
  },
  {
    question: 'What currencies do you support?',
    answer:
      'We support all major currencies including USD, EUR, GBP, INR, JPY, AUD, and more. You can change your preferred currency in settings.',
  },
];