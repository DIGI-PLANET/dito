-- Migration 001: Add Solana on-chain fields to souls
ALTER TABLE souls ADD COLUMN IF NOT EXISTS mint_tx text;
ALTER TABLE souls ADD COLUMN IF NOT EXISTS mint_address text;
ALTER TABLE souls ADD COLUMN IF NOT EXISTS on_chain boolean DEFAULT false;

COMMENT ON COLUMN souls.mint_tx IS 'Solana transaction signature';
COMMENT ON COLUMN souls.mint_address IS 'NFT mint address on Solana';
COMMENT ON COLUMN souls.on_chain IS 'Whether SBT has been minted on-chain';
