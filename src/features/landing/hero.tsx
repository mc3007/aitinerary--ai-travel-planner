import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { useNavigate } from 'react-router-dom';

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:px-8">
      {/* Floating gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-secondary/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Travel Planning</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          From Inspiration to{' '}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Itinerary
          </span>{' '}
          in Seconds.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          Turn Instagram Reels, YouTube videos, and your travel preferences into
          personalized journeys. No more switching between a dozen tabs.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            size="xl"
            className="w-full sm:w-auto"
            onClick={() => navigate('/signup')}
          >
            Start Planning
          </Button>
          <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
            <Button
              size="xl"
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              onClick={() => setDemoOpen(true)}
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </Button>
            <DialogContent className="max-w-4xl p-1 sm:rounded-2xl">
              <DialogTitle className="sr-only">AITinerary Demo</DialogTitle>
              <DialogDescription className="sr-only">
                Watch how AITinerary plans your perfect trip in seconds.
              </DialogDescription>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                <video
                  src="/Demo%20video.mp4"
                  controls
                  autoPlay
                  className="h-full w-full object-contain"
                />
              </div>
              <button
                onClick={() => setDemoOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur-sm transition-colors hover:bg-background cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16"
        >
          <div
            className="relative mx-auto max-w-4xl cursor-pointer rounded-2xl border border-border/50 bg-card/50 p-2 shadow-2xl backdrop-blur-sm transition-shadow hover:shadow-primary/10"
            onClick={() => setDemoOpen(true)}
          >
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <video
                src="/Demo%20video.mp4"
                className="h-full w-full object-contain pointer-events-none"
                preload="metadata"
                muted
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                  <Play className="h-6 w-6 ml-0.5" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}