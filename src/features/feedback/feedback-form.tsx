import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';
import { MessageSquare, Star, Send, CheckCircle, ArrowLeft } from 'lucide-react';

type FeedbackType = 'general' | 'bug' | 'feature' | 'improvement';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; description: string }[] = [
  {
    value: 'general',
    label: 'General Feedback',
    description: 'Share your thoughts about AITinerary',
  },
  {
    value: 'bug',
    label: 'Bug Report',
    description: 'Something isn\'t working as expected',
  },
  {
    value: 'feature',
    label: 'Feature Request',
    description: 'Suggest something new',
  },
  {
    value: 'improvement',
    label: 'Improvement',
    description: 'Make an existing feature better',
  },
];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' && star < 5) onChange(star + 1);
            if (e.key === 'ArrowLeft' && star > 1) onChange(star - 1);
          }}
          className={`cursor-pointer rounded-lg p-1 transition-all duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            star <= value ? 'text-amber-400' : 'text-muted-foreground/30'
          }`}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          aria-checked={star <= value}
          role="radio"
        >
          <Star
            className={`h-7 w-7 transition-all duration-150 ${
              star <= value ? 'fill-amber-400 drop-shadow-sm' : ''
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function FeedbackForm() {
  const { user } = useAuth();
  const [step, setStep] = useState<'type' | 'form' | 'success'>('type');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSelectType = (type: FeedbackType) => {
    setFeedbackType(type);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!message.trim()) {
      setError('Please write a message before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const { error: submitError } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        name: name.trim() || null,
        email: email.trim() || null,
        feedback_type: feedbackType,
        message: message.trim(),
        rating: rating || 0,
        page_url: window.location.pathname,
      });

      if (submitError) throw submitError;

      setStep('success');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('type');
    setMessage('');
    setRating(0);
    setError('');
  };

  const selectedType = FEEDBACK_TYPES.find((t) => t.value === feedbackType);

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <AnimatePresence mode="wait">
        {step === 'type' && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                Share Your Feedback
              </h1>
              <p className="mt-2 text-muted-foreground">
                Help us make AITinerary better for everyone. What's on your mind?
              </p>
            </div>

            <div className="grid gap-3">
              {FEEDBACK_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleSelectType(type.value)}
                  className="group flex cursor-pointer items-start gap-4 rounded-xl border border-border/50 bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{type.label}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <CardTitle className="text-lg">{selectedType?.label}</CardTitle>
                    <CardDescription>{selectedType?.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <form ref={formRef} onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                  {/* Name */}
                  <Input
                    id="feedback-name"
                    label="Your Name (optional)"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  {/* Email */}
                  <Input
                    id="feedback-email"
                    label="Email (optional — for follow-up)"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  {/* Message */}
                  <div className="w-full">
                    <label
                      htmlFor="feedback-message"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Your Message <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      id="feedback-message"
                      rows={5}
                      placeholder={
                        feedbackType === 'bug'
                          ? 'What happened? What did you expect instead?'
                          : feedbackType === 'feature'
                            ? 'Describe the feature you\'d like to see...'
                            : 'Share your thoughts, ideas, or suggestions...'
                      }
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Rate Your Experience (optional)
                    </label>
                    <StarRating value={rating} onChange={setRating} />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive"
                    >
                      {error}
                    </motion.p>
                  )}
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2"
                    disabled={submitting || !message.trim()}
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Feedback
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Your feedback helps us improve AITinerary for everyone. Thank you!
                  </p>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/50 shadow-lg">
              <CardContent className="py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30"
                >
                  <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-heading text-xl font-bold text-foreground"
                >
                  Thank You!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-muted-foreground"
                >
                  Your feedback has been received. We review every submission and use it
                  to make AITinerary better for everyone.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
                >
                  <Button variant="outline" onClick={handleReset}>
                    Submit Another
                  </Button>
                  <Button onClick={() => window.history.back()}>
                    Go Back
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
