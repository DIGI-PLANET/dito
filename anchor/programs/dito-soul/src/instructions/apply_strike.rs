use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::DitoError;
use crate::events::StrikeApplied;

#[derive(Accounts)]
pub struct ApplyStrike<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"global"],
        bump = global_state.bump,
        has_one = authority @ DitoError::NotAuthorized,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        seeds = [b"user", user_account.wallet.as_ref()],
        bump = user_account.bump,
    )]
    pub user_account: Account<'info, UserAccount>,
}

pub fn handle_apply_strike(ctx: Context<ApplyStrike>) -> Result<()> {
    let user = &mut ctx.accounts.user_account;
    user.strikes = user.strikes.checked_add(1).ok_or(DitoError::MaxStrikesReached)?;

    let now = Clock::get()?.unix_timestamp;

    emit!(StrikeApplied {
        wallet: user.wallet,
        strike_count: user.strikes,
        timestamp: now,
    });

    // 3 strikes → ban: zero out souls and trust
    // NOTE: Individual SoulAccount closure requires separate transactions
    if user.strikes >= 3 {
        user.souls_count = 0;
        user.trust_score = 0;
    }

    Ok(())
}
