use anchor_lang::prelude::*;
use crate::state::SoulStage;

#[event]
pub struct SoulMinted {
    pub wallet: Pubkey,
    pub talent_hash: [u8; 32],
    pub mint_address: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct StageUpdated {
    pub soul: Pubkey,
    pub old_stage: SoulStage,
    pub new_stage: SoulStage,
    pub timestamp: i64,
}

#[event]
pub struct DecayApplied {
    pub soul: Pubkey,
    pub old_stage: SoulStage,
    pub new_stage: SoulStage,
    pub timestamp: i64,
}

#[event]
pub struct StrikeApplied {
    pub wallet: Pubkey,
    pub strike_count: u8,
    pub timestamp: i64,
}

#[event]
pub struct PaymentReceived {
    pub wallet: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
