use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::DitoError;
use crate::events::DecayApplied;

#[derive(Accounts)]
pub struct ApplyDecay<'info> {
    /// Anyone can crank decay
    #[account(mut)]
    pub cranker: Signer<'info>,

    #[account(
        mut,
        seeds = [b"soul", soul_account.owner.as_ref(), soul_account.talent_hash.as_ref()],
        bump = soul_account.bump,
        constraint = !soul_account.decayed @ DitoError::SoulDecayed,
    )]
    pub soul_account: Account<'info, SoulAccount>,

    #[account(
        mut,
        seeds = [b"user", soul_account.owner.as_ref()],
        bump = user_account.bump,
    )]
    pub user_account: Account<'info, UserAccount>,
}

pub fn handle_apply_decay(ctx: Context<ApplyDecay>) -> Result<()> {
    let soul = &mut ctx.accounts.soul_account;
    let now = Clock::get()?.unix_timestamp;
    let elapsed_days = (now - soul.last_activity) / 86_400;

    let old_stage = soul.stage.clone();

    let (new_stage, should_close) = match soul.stage {
        SoulStage::Eternal => return err!(DitoError::EternalNeverDecays),
        SoulStage::Sparked  if elapsed_days >= 7  => (SoulStage::Sparked, true),  // → Dormant
        SoulStage::Burning  if elapsed_days >= 14 => (SoulStage::Sparked, false),
        SoulStage::Blazing  if elapsed_days >= 21 => (SoulStage::Burning, false),
        SoulStage::Radiant  if elapsed_days >= 30 => (SoulStage::Blazing, false),
        _ => return err!(DitoError::DecayNotEligible),
    };

    if should_close {
        // Mark as decayed — account can be closed and rent reclaimed
        soul.decayed = true;
        soul.period_entries = 0;

        let user = &mut ctx.accounts.user_account;
        user.souls_count = user.souls_count.saturating_sub(1);
    } else {
        soul.stage = new_stage.clone();
        soul.period_entries = 0;
    }

    emit!(DecayApplied {
        soul: soul.key(),
        old_stage,
        new_stage: if should_close { SoulStage::Sparked } else { new_stage },
        timestamp: now,
    });

    Ok(())
}
