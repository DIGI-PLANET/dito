-- Migration 007: Add status column to souls for draft → minted flow
ALTER TABLE souls ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

COMMENT ON COLUMN souls.status IS 'Soul lifecycle status: draft (created, not minted) or minted (NFT minted on-chain)';

-- Backfill: existing souls with mint_address are already minted
UPDATE souls SET status = 'minted' WHERE mint_address IS NOT NULL AND status = 'draft';
