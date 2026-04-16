use anchor_lang::prelude::*;
use crate::state::{GlobalState, UserAccount};
use crate::errors::DitoError;

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(mut)]
    pub wallet: Signer<'info>,

    #[account(
        init,
        payer = wallet,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user", wallet.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"global"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_user(ctx: Context<CreateUser>, display_name: String) -> Result<()> {
    require!(display_name.len() <= 50, DitoError::NameTooLong);

    let user = &mut ctx.accounts.user_account;
    user.wallet = ctx.accounts.wallet.key();
    user.display_name = display_name;
    user.souls_count = 0;
    user.trust_score = 0;
    user.created_at = Clock::get()?.unix_timestamp;
    user.strikes = 0;
    user.verified = false;
    user.bump = ctx.bumps.user_account;

    let global = &mut ctx.accounts.global_state;
    global.total_users = global.total_users.checked_add(1).unwrap();

    Ok(())
}
