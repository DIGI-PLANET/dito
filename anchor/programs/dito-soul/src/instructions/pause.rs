use anchor_lang::prelude::*;
use crate::state::GlobalState;
use crate::errors::DitoError;

#[derive(Accounts)]
pub struct TogglePause<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"global"],
        bump = global_state.bump,
        has_one = authority @ DitoError::NotAuthorized,
    )]
    pub global_state: Account<'info, GlobalState>,
}

pub fn handle_pause(ctx: Context<TogglePause>) -> Result<()> {
    ctx.accounts.global_state.paused = true;
    Ok(())
}

pub fn handle_unpause(ctx: Context<TogglePause>) -> Result<()> {
    ctx.accounts.global_state.paused = false;
    Ok(())
}
