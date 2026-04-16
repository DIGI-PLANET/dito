use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::DitoError;
use crate::events::StageUpdated;

/// Achievement rate requirements per stage transition (V3 Master Plan)
/// Sparked → Burning:  20/25 days (80%) over ~3-4 weeks
/// Burning → Blazing:  56/70 days (80%) over ~9-10 weeks
/// Blazing → Radiant:  95/112 days (85%) over ~14-16 weeks
const SPARKED_TO_BURNING_REQUIRED: u16 = 20;
const SPARKED_TO_BURNING_PERIOD_DAYS: i64 = 25;

const BURNING_TO_BLAZING_REQUIRED: u16 = 56;
const BURNING_TO_BLAZING_PERIOD_DAYS: i64 = 70;

const BLAZING_TO_RADIANT_REQUIRED: u16 = 95;
const BLAZING_TO_RADIANT_PERIOD_DAYS: i64 = 112;

#[derive(Accounts)]
pub struct UpdateStage<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"global"],
        bump = global_state.bump,
        has_one = authority @ DitoError::NotAuthorized,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        seeds = [b"user", soul_account.owner.as_ref()],
        bump = user_account.bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"soul", soul_account.owner.as_ref(), soul_account.talent_hash.as_ref()],
        bump = soul_account.bump,
        constraint = !soul_account.decayed @ DitoError::SoulDecayed,
    )]
    pub soul_account: Account<'info, SoulAccount>,
}

pub fn handle_update_stage(ctx: Context<UpdateStage>, new_stage: SoulStage) -> Result<()> {
    let soul = &mut ctx.accounts.soul_account;
    let user = &ctx.accounts.user_account;
    let now = Clock::get()?.unix_timestamp;

    // Stage can only advance by exactly one step
    require!(
        (new_stage.clone() as u8) == (soul.stage.clone() as u8) + 1,
        DitoError::InvalidStage
    );

    // Blazing+ requires identity verification
    if new_stage.clone() as u8 >= SoulStage::Blazing as u8 {
        require!(user.verified, DitoError::UserNotVerified);
    }

    // Validate achievement rate based on current → next stage
    let elapsed_days = (now - soul.period_start) / 86_400;

    match soul.stage {
        SoulStage::Sparked => {
            // Need 20 entries within 25-day period
            require!(elapsed_days >= SPARKED_TO_BURNING_PERIOD_DAYS, DitoError::PeriodNotComplete);
            require!(soul.period_entries >= SPARKED_TO_BURNING_REQUIRED, DitoError::InsufficientAchievement);
        }
        SoulStage::Burning => {
            // Need 56 entries within 70-day period
            require!(elapsed_days >= BURNING_TO_BLAZING_PERIOD_DAYS, DitoError::PeriodNotComplete);
            require!(soul.period_entries >= BURNING_TO_BLAZING_REQUIRED, DitoError::InsufficientAchievement);
        }
        SoulStage::Blazing => {
            // Need 95 entries within 112-day period
            require!(elapsed_days >= BLAZING_TO_RADIANT_PERIOD_DAYS, DitoError::PeriodNotComplete);
            require!(soul.period_entries >= BLAZING_TO_RADIANT_REQUIRED, DitoError::InsufficientAchievement);
        }
        SoulStage::Radiant => {
            // Radiant → Eternal: authority decision (no automatic criteria)
        }
        SoulStage::Eternal => {
            return err!(DitoError::InvalidStage); // Already max
        }
    }

    let old_stage = soul.stage.clone();
    soul.stage = new_stage.clone();

    // Reset period tracking for next stage
    soul.period_entries = 0;
    soul.period_start = now;

    emit!(StageUpdated {
        soul: soul.key(),
        old_stage,
        new_stage,
        timestamp: now,
    });

    Ok(())
}
