use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::DitoError;

#[derive(Accounts)]
pub struct RecordActivity<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"global"],
        bump = global_state.bump,
        has_one = authority @ DitoError::NotAuthorized,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        seeds = [b"soul", soul_account.owner.as_ref(), soul_account.talent_hash.as_ref()],
        bump = soul_account.bump,
        constraint = !soul_account.decayed @ DitoError::SoulDecayed,
    )]
    pub soul_account: Account<'info, SoulAccount>,
}

pub fn handle_record_activity(ctx: Context<RecordActivity>) -> Result<()> {
    let soul = &mut ctx.accounts.soul_account;
    let now = Clock::get()?.unix_timestamp;

    // Prevent double-counting: max 1 entry per calendar day (86400s)
    let last_day = soul.last_activity / 86_400;
    let today = now / 86_400;
    require!(today > last_day, DitoError::AlreadyRecordedToday);

    // Increment lifetime total
    soul.entries_count = soul.entries_count.checked_add(1).unwrap();

    // Increment period activity count (for achievement rate calculation)
    soul.period_entries = soul.period_entries.saturating_add(1);

    soul.last_activity = now;

    Ok(())
}
