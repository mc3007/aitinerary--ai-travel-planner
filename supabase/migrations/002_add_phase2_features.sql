-- Phase 2: AI Travel Platform
-- Migration 002: Add profiles columns and new tables

-- ============================================
-- 1. Extend profiles table
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pace text DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS food_preferences text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS home_airport text,
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS favorite_countries text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS visited_countries text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS wishlist text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avoided_activities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS favorite_cuisine text,
ADD COLUMN IF NOT EXISTS preferred_walking_distance integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS preferred_daily_activity_count integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS preferred_airlines text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_hotels text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_accommodation_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS travel_goals text,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- ============================================
-- 2. Collections (for saved places)
-- ============================================
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#6366f1',
  icon text DEFAULT '📁',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. Saved Places
-- ============================================
CREATE TABLE IF NOT EXISTS saved_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  name text NOT NULL,
  place_type text NOT NULL DEFAULT 'activity',
  lat double precision,
  lng double precision,
  address text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT '',
  notes text DEFAULT '',
  image_url text DEFAULT '',
  tags text[] DEFAULT '{}',
  rating real DEFAULT 0,
  price_level integer DEFAULT 0,
  website text DEFAULT '',
  phone text DEFAULT '',
  ai_recommendation_reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. Notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'generic',
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  actionable boolean DEFAULT false,
  action_url text DEFAULT '',
  action_label text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 5. AI Memory
-- ============================================
CREATE TABLE IF NOT EXISTS ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  context_type text NOT NULL DEFAULT 'conversation',
  key text NOT NULL,
  value jsonb NOT NULL,
  summary text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);

-- ============================================
-- 6. AI Suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'generic',
  title text NOT NULL,
  message text NOT NULL,
  context text DEFAULT '',
  priority text DEFAULT 'normal',
  dismissed boolean DEFAULT false,
  applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_collection_id ON saved_places(collection_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_id ON ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_context ON ai_memory(user_id, context_type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_trip_id ON ai_suggestions(trip_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_collections_updated_at') THEN
    CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_saved_places_updated_at') THEN
    CREATE TRIGGER update_saved_places_updated_at BEFORE UPDATE ON saved_places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_memory_updated_at') THEN
    CREATE TRIGGER update_ai_memory_updated_at BEFORE UPDATE ON ai_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Collections
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage their own collections') THEN
    CREATE POLICY "Users manage their own collections"
      ON collections FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- Saved Places
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage their own saved places') THEN
    CREATE POLICY "Users manage their own saved places"
      ON saved_places FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- Notifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage their own notifications') THEN
    CREATE POLICY "Users manage their own notifications"
      ON notifications FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- AI Memory
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage their own AI memory') THEN
    CREATE POLICY "Users manage their own AI memory"
      ON ai_memory FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- AI Suggestions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage their own AI suggestions') THEN
    CREATE POLICY "Users manage their own AI suggestions"
      ON ai_suggestions FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END;
$$;