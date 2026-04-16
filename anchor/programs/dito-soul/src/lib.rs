use anchor_lang::prelude::*;

declare_id!("GM6HQiRTHbL99KX1mgco8Es3DdgcjumohVJrk8oUPuMz");

pub mod state;
pub mod instructions;
pub mod events;
pub mod errors;

use instructions::*;
use state::SoulStage;

#[program]
pub mod dito_soul {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, mint_price: u64) -> Result<()> {
        instructions::initialize::handle_initialize(ctx, mint_price)
    }

    pub fn create_user(ctx: Context<CreateUser>, display_name: String) -> Result<()> {
        instructions::create_user::handle_create_user(ctx, display_name)
    }

    pub fn mint_soul(
        ctx: Context<MintSoul>,
        talent_label: String,
        talent_hash: [u8; 32],
        proof_hash: [u8; 32],
        traits: Vec<String>,
    ) -> Result<()> {
        instructions::mint_soul::handle_mint_soul(ctx, talent_label, talent_hash, proof_hash, traits)
    }

    pub fn update_stage(ctx: Context<UpdateStage>, new_stage: SoulStage) -> Result<()> {
        instructions::update_stage::handle_update_stage(ctx, new_stage)
    }

    pub fn apply_decay(ctx: Context<ApplyDecay>) -> Result<()> {
        instructions::apply_decay::handle_apply_decay(ctx)
    }

    pub fn record_activity(ctx: Context<RecordActivity>) -> Result<()> {
        instructions::record_activity::handle_record_activity(ctx)
    }

    pub fn apply_strike(ctx: Context<ApplyStrike>) -> Result<()> {
        instructions::apply_strike::handle_apply_strike(ctx)
    }

    pub fn verify_identity(ctx: Context<VerifyIdentity>, verified: bool) -> Result<()> {
        instructions::verify_identity::handle_verify_identity(ctx, verified)
    }

    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
        instructions::withdraw_treasury::handle_withdraw_treasury(ctx, amount)
    }

    pub fn pause(ctx: Context<TogglePause>) -> Result<()> {
        instructions::pause::handle_pause(ctx)
    }

    pub fn unpause(ctx: Context<TogglePause>) -> Result<()> {
        instructions::pause::handle_unpause(ctx)
    }
}
