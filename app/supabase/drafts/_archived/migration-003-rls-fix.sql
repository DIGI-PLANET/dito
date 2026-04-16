-- Migration 003: RLS 보안 수정 — anon 전면 차단
-- 날짜: 2026-02-17
-- 
-- 배경: 모든 API가 service_role key를 사용하므로 RLS를 우회함.
-- anon key가 NEXT_PUBLIC_SUPABASE_ANON_KEY로 노출되어 있어 직접 REST API 접근 가능.
-- anon JWT에는 wallet_address가 없으므로 행 단위 필터링 불가 → 전면 차단이 유일한 안전책.
--
-- 이 마이그레이션은 migration-002가 미적용된 경우를 대비해 독립적으로 실행 가능하도록 작성됨.
-- 멱등성: DROP POLICY IF EXISTS 사용.

BEGIN;

-- ============================================================
-- 1. RLS 활성화 확인 (이미 활성화되어 있어도 안전)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. 기존 과도한 정책 제거
-- ============================================================
-- migration-001에서 생성된 USING(true) 정책
DROP POLICY IF EXISTS "Service role full access" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON diary_entries;
DROP POLICY IF EXISTS "Service role full access" ON souls;
DROP POLICY IF EXISTS "Service role full access" ON discovery_sessions;
DROP POLICY IF EXISTS "Service role full access" ON notifications;

-- migration-001의 다른 이름 변형 (안전하게 정리)
DROP POLICY IF EXISTS "Allow all" ON profiles;
DROP POLICY IF EXISTS "Allow all" ON diary_entries;
DROP POLICY IF EXISTS "Allow all" ON souls;
DROP POLICY IF EXISTS "Allow all" ON discovery_sessions;
DROP POLICY IF EXISTS "Allow all" ON notifications;

-- migration-002에서 생성되었을 수 있는 정책 (중복 방지)
DROP POLICY IF EXISTS "Deny anon select" ON profiles;
DROP POLICY IF EXISTS "Deny anon insert" ON profiles;
DROP POLICY IF EXISTS "Deny anon update" ON profiles;
DROP POLICY IF EXISTS "Deny anon delete" ON profiles;
DROP POLICY IF EXISTS "Deny anon select" ON diary_entries;
DROP POLICY IF EXISTS "Deny anon insert" ON diary_entries;
DROP POLICY IF EXISTS "Deny anon update" ON diary_entries;
DROP POLICY IF EXISTS "Deny anon delete" ON diary_entries;
DROP POLICY IF EXISTS "Deny anon select" ON souls;
DROP POLICY IF EXISTS "Deny anon insert" ON souls;
DROP POLICY IF EXISTS "Deny anon update" ON souls;
DROP POLICY IF EXISTS "Deny anon delete" ON souls;
DROP POLICY IF EXISTS "Deny anon select" ON discovery_sessions;
DROP POLICY IF EXISTS "Deny anon insert" ON discovery_sessions;
DROP POLICY IF EXISTS "Deny anon update" ON discovery_sessions;
DROP POLICY IF EXISTS "Deny anon delete" ON discovery_sessions;
DROP POLICY IF EXISTS "Deny anon select" ON notifications;
DROP POLICY IF EXISTS "Deny anon insert" ON notifications;
DROP POLICY IF EXISTS "Deny anon update" ON notifications;
DROP POLICY IF EXISTS "Deny anon delete" ON notifications;

-- ============================================================
-- 3. service_role 전용 정책 (anon은 암묵적으로 차단됨)
-- ============================================================
-- RLS가 활성화된 상태에서 정책이 없으면 기본 차단.
-- service_role은 RLS를 우회하므로 사실상 정책 불필요.
-- 하지만 명시적 정책이 있으면 의도가 명확하고 감사 시 이해하기 쉬움.

CREATE POLICY "service_role_only" ON profiles
  FOR ALL TO authenticated, anon
  USING (false);

CREATE POLICY "service_role_only" ON diary_entries
  FOR ALL TO authenticated, anon
  USING (false);

CREATE POLICY "service_role_only" ON souls
  FOR ALL TO authenticated, anon
  USING (false);

CREATE POLICY "service_role_only" ON discovery_sessions
  FOR ALL TO authenticated, anon
  USING (false);

CREATE POLICY "service_role_only" ON notifications
  FOR ALL TO authenticated, anon
  USING (false);

COMMIT;

-- ============================================================
-- 검증 쿼리 (적용 후 실행)
-- ============================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
