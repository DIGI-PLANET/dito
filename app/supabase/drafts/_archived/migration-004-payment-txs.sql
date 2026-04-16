-- migration-004: used_payment_txs 테이블 (민팅 결제 tx 재사용 방지)
-- 실행: Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS used_payment_txs (
  tx_signature TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  amount_lamports BIGINT,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for wallet lookup
CREATE INDEX IF NOT EXISTS idx_used_payment_txs_wallet 
  ON used_payment_txs(wallet_address);

-- RLS: anon/authenticated 차단 (service_role만 접근)
ALTER TABLE used_payment_txs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_only_select" ON used_payment_txs
  FOR SELECT USING (false);
CREATE POLICY "service_only_insert" ON used_payment_txs
  FOR INSERT WITH CHECK (false);
