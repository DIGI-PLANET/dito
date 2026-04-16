-- Migration 010: Merge chat_messages back into diary_entries
-- Consolidates message storage back to single table

-- 1. Migrate existing chat_messages data to diary_entries
INSERT INTO diary_entries (
  user_id,
  profile_id,
  date,
  role,
  content,
  embedding,
  created_at
)
SELECT 
  cm.profile_id as user_id,
  cm.profile_id,
  cm.created_at::date as date,
  cm.role,
  cm.content,
  cm.embedding,
  cm.created_at
FROM chat_messages cm
WHERE NOT EXISTS (
  SELECT 1 FROM diary_entries de 
  WHERE de.user_id = cm.profile_id 
    AND de.content = cm.content 
    AND de.created_at = cm.created_at
);

-- 2. Drop chat_messages related objects
DROP FUNCTION IF EXISTS match_chat_messages(vector, float, int, uuid);
DROP TABLE IF EXISTS chat_messages;

-- 3. Update diary_entries vector search function to be more generic
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

-- 4. Ensure diary_entries has proper indexes for both chat and diary use cases
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_created ON diary_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_embedding ON diary_entries USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);