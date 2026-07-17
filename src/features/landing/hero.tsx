import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { useNavigate } from 'react-router-dom';

const DEMO_VIDEO_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Replace with your actual demo video URL

function DemoPreviewImage({
  onPlay,
  className,
}: {
  onPlay: () => void;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-black ${className || ''}`}>
      <img
        src="/AITinerary.png"
        alt="AITinerary preview — AI travel planner"
        className="h-full w-full object-cover"
      />
      {/* Gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Play button overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className="group absolute inset-0 flex cursor-pointer items-center justify-center transition-colors hover:bg-black/10"
        aria-label="Play demo video"
      >
        <motion.div
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-all duration-200 group-hover:bg-white group-hover:shadow-2xl"
        >
          <Play className="ml-0.5 h-7 w-7 fill-primary text-primary" />
        </motion.div>
      </button>

      {/* Label */}
      <div className="absolute bottom-4 left-4 right-4">
        <p className="text-sm font-medium text-white/90 drop-shadow-sm">
          Watch Demo — See AITinerary in Action
        </p>
      </div>
    </div>
  );
}

function DemoVideoPlayer({ onClose }: { onClose: () => void }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe
        src={DEMO_VIDEO_URL}
        title="AITinerary Demo Video"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80 cursor-pointer"
        aria-label="Close video"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const navigate = useNavigate();

  const handleOpenDemo = () => {
    setVideoPlaying(false);
    setDemoOpen(true);
  };

  const handlePlayInDialog = () => {
    setVideoPlaying(true);
  };

  const handlePlayPreview = () => {
    setPreviewPlaying(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setDemoOpen(open);
    if (!open) {
      setVideoPlaying(false);
    }
  };

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
          <Dialog open={demoOpen} onOpenChange={handleCloseDialog}>
            <Button
              size="xl"
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              onClick={handleOpenDemo}
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </Button>
            <DialogContent className="max-w-4xl p-1 sm:rounded-2xl">
              <DialogTitle className="sr-only">AITinerary Demo</DialogTitle>
              <DialogDescription className="sr-only">
                Watch how AITinerary plans your perfect trip in seconds.
              </DialogDescription>
              <AnimatePresence mode="wait">
                {videoPlaying ? (
                  <motion.div
                    key="video"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DemoVideoPlayer onClose={() => setVideoPlaying(false)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DemoPreviewImage
                      onPlay={handlePlayInDialog}
                      className="aspect-video"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16"
        >
          <div className="relative mx-auto max-w-4xl rounded-2xl border border-border/50 bg-card/50 p-2 shadow-2xl backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {previewPlaying ? (
                <motion.div
                  key="preview-video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoVideoPlayer onClose={() => setPreviewPlaying(false)} />
                </motion.div>
              ) : (
                <motion.div
                  key="preview-image"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoPreviewImage
                    onPlay={handlePlayPreview}
                    className="aspect-video"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
