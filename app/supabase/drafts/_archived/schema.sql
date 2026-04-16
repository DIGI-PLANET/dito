-- DITO.guru Supabase Schema
-- Run via SQL Editor or service role API

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles (wallet-based auth)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  links jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Diary entries with vector embeddings
CREATE TABLE IF NOT EXISTS diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  image text,
  embedding vector(768),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_entries(user_id, date);

-- Souls (SBT records)
CREATE TABLE IF NOT EXISTS souls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  talent_label text NOT NULL,
  traits text[] DEFAULT '{}',
  description text,
  stage text NOT NULL DEFAULT 'sparked' CHECK (stage IN ('sparked', 'burning', 'blazing', 'radiant', 'eternal')),
  mint_date date,
  proof_hash text,
  entries_count int DEFAULT 0,
  streak int DEFAULT 0,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Discovery sessions
CREATE TABLE IF NOT EXISTS discovery_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'decided')),
  decided_talent text,
  turn_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_diary_entries(
  query_embedding vector(768),
  match_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  date date,
  role text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.date,
    de.role,
    de.content,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM diary_entries de
  WHERE de.user_id = match_user_id
    AND de.embedding IS NOT NULL
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Service role bypass (server-side API calls)
CREATE POLICY "Service role full access" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON diary_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON souls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON discovery_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true) WITH CHECK (true);
