-- Migration 006: Soft Delete + Audit Log for Rollback Support
-- Run via Supabase SQL Editor

-- 1. Add deleted_at columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE souls ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- 2. Indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_souls_deleted_at ON souls(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diary_entries_deleted_at ON diary_entries(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_at ON chat_messages(deleted_at) WHERE deleted_at IS NOT NULL;

-- 3. Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'restore'
  old_data JSONB,
  new_data JSONB,
  performed_by TEXT, -- wallet_address or 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- 4. RLS for audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Block anon access
CREATE POLICY "Deny anon access" ON audit_log FOR ALL TO anon USING (false) WITH CHECK (false);

-- Service role full access
CREATE POLICY "Service role full access" ON audit_log FOR ALL USING (true) WITH CHECK (true);
