-- migration-005-split-chat-diary.sql
-- Split chat_messages from diary_entries (schema separation)
-- Data migration (moving existing chat rows) is separate — Roy runs manually.

-- chat_messages 테이블 생성
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_chat_messages_profile ON chat_messages(profile_id);
CREATE INDEX idx_chat_messages_embedding ON chat_messages USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- RLS: anon/authenticated 차단
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON chat_messages FOR ALL TO authenticated, anon USING (false);

-- match_chat_messages RPC
CREATE OR REPLACE FUNCTION match_chat_messages(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_profile_id uuid
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  role text,
  content text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.profile_id,
    cm.role,
    cm.content,
    cm.created_at,
    1 - (cm.embedding <=> query_embedding) AS similarity
  FROM chat_messages cm
  WHERE cm.profile_id = p_profile_id
    AND cm.embedding IS NOT NULL
    AND 1 - (cm.embedding <=> query_embedding) > match_threshold
  ORDER BY cm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- diary_entries에 profile_id 컬럼 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diary_entries' AND column_name='profile_id') THEN
    ALTER TABLE diary_entries ADD COLUMN profile_id UUID REFERENCES profiles(id);
  END IF;
END $$;
