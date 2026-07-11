import { motion } from 'framer-motion';
import { Hero } from './hero';
import { Features } from './features';
import { FAQ } from './faq';
// TODO: Uncomment when ready to launch
// import { Testimonials } from './testimonials';
// import { Pricing } from './pricing';

export function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Hero />
      <Features />
      <FAQ />
    </motion.div>
  );
}