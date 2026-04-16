-- Migration 002: Restrict anon access via RLS
-- Service role bypasses RLS, so our API routes still work.
-- This prevents direct anon-key access from client-side.

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Service role full access" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON diary_entries;
DROP POLICY IF EXISTS "Service role full access" ON souls;
DROP POLICY IF EXISTS "Service role full access" ON discovery_sessions;
DROP POLICY IF EXISTS "Service role full access" ON notifications;

-- Deny all access for anon role (no direct client-side DB access)
-- RLS is already enabled on all tables from migration-001.
-- With no USING policies for anon, all access is denied by default.
-- The service_role key used in API routes bypasses RLS entirely.

-- Optional: explicit deny policies for clarity
CREATE POLICY "Deny anon select" ON profiles FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert" ON profiles FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update" ON profiles FOR UPDATE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon delete" ON profiles FOR DELETE TO anon USING (false);

CREATE POLICY "Deny anon select" ON diary_entries FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert" ON diary_entries FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update" ON diary_entries FOR UPDATE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon delete" ON diary_entries FOR DELETE TO anon USING (false);

CREATE POLICY "Deny anon select" ON souls FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert" ON souls FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update" ON souls FOR UPDATE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon delete" ON souls FOR DELETE TO anon USING (false);

CREATE POLICY "Deny anon select" ON discovery_sessions FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert" ON discovery_sessions FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update" ON discovery_sessions FOR UPDATE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon delete" ON discovery_sessions FOR DELETE TO anon USING (false);

CREATE POLICY "Deny anon select" ON notifications FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert" ON notifications FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update" ON notifications FOR UPDATE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon delete" ON notifications FOR DELETE TO anon USING (false);
