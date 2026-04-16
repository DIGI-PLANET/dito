-- Ember 리팩토링: 인증 기반 생성 + Ember 이름 + soft delete
-- 기존: anonymous claim_token 기반 → 변경: authenticated user_id 직접 연결
-- nickname(사용자 닉네임) → ember_name(Ember 고유 이름)

-- 1. nickname → ember_name rename + VARCHAR(16) 제한 (문자만 허용, 특수문자/숫자/공백 불가)
ALTER TABLE embers RENAME COLUMN nickname TO ember_name;
ALTER TABLE embers ALTER COLUMN ember_name TYPE VARCHAR(16);

-- 2. claim_token, claimed_at 제거 (더 이상 anonymous claim 불필요)
ALTER TABLE embers DROP COLUMN IF EXISTS claim_token;
ALTER TABLE embers DROP COLUMN IF EXISTS claimed_at;

-- 3. abandoned_at 추가 (soft delete / Ember 포기)
ALTER TABLE embers ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMPTZ;

-- 4. user_id NOT NULL (인증 필수)
ALTER TABLE embers ALTER COLUMN user_id SET NOT NULL;

-- 5. 1인 1활성 Ember 보장 (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_embers_active_user
  ON embers (user_id) WHERE abandoned_at IS NULL;

-- 6. discovery_turns 추가 (탐색 턴 수 기록 → 지표 활용)
ALTER TABLE embers ADD COLUMN IF NOT EXISTS discovery_turns INTEGER DEFAULT 0;
