use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::DitoError;

#[derive(Accounts)]
pub struct VerifyIdentity<'info> {
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

pub fn handle_verify_identity(ctx: Context<VerifyIdentity>, verified: bool) -> Result<()> {
    ctx.accounts.user_account.verified = verified;
    Ok(())
}
