import { motion } from 'framer-motion';
import {
  Sparkles,
  Compass,
  Wallet,
  Users,
  Bot,
  Link,
} from 'lucide-react';

const features = [
  {
    title: 'AI Trip Planning',
    description:
      'Describe your dream trip in plain language and let AI craft a perfect day-by-day itinerary tailored to your preferences.',
    icon: Sparkles,
    gradient: 'from-primary to-secondary',
  },
  {
    title: 'Hidden Gems',
    description:
      'Discover non-touristy places, scenic routes, and local secrets that typical travel guides miss.',
    icon: Compass,
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    title: 'Budget Planner',
    description:
      'Track every expense with visual charts. Get savings suggestions and never overspend on your trip.',
    icon: Wallet,
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    title: 'Expense Split',
    description:
      'Traveling with friends? Split costs, track shared expenses, and auto-settle at trip end.',
    icon: Users,
    gradient: 'from-rose-400 to-pink-500',
  },
  {
    title: 'Travel Companion',
    description:
      'Ask your AI companion anything — from local food recommendations to real-time itinerary adjustments.',
    icon: Bot,
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    title: 'Social Media Planner',
    description:
      'Paste an Instagram Reel or YouTube video and let AI extract locations to build your trip.',
    icon: Link,
    gradient: 'from-sky-400 to-blue-500',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function Features() {
  return (
    <section id="features" className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Plan Perfectly
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From AI-generated itineraries to budget tracking, AITinerary has
            every tool you need for stress-free travel planning.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}