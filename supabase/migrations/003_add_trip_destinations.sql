-- Add a normalized trip destinations table so multi-destination trips can store per-destination nights/order.
CREATE TABLE IF NOT EXISTS public.trip_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nights INT NOT NULL DEFAULT 1,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable row-level security.
ALTER TABLE public.trip_destinations ENABLE ROW LEVEL SECURITY;

-- RLS policies for trip_destinations.
CREATE POLICY "Users can view their own trip destinations"
  ON public.trip_destinations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trip destinations"
  ON public.trip_destinations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip destinations"
  ON public.trip_destinations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip destinations"
  ON public.trip_destinations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure an updated_at helper exists.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add an updated_at trigger on trip_destinations if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.trip_destinations'::regclass
      AND tgname = 'trip_destinations_updated_at'
  ) THEN
    CREATE TRIGGER trip_destinations_updated_at
      BEFORE UPDATE ON public.trip_destinations
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;
