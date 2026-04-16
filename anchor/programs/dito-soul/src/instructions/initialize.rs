use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use crate::state::{GlobalState, TreasuryState};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + GlobalState::INIT_SPACE,
        seeds = [b"global"],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        init,
        payer = authority,
        space = 8 + TreasuryState::INIT_SPACE,
        seeds = [b"treasury"],
        bump,
    )]
    pub treasury_state: Account<'info, TreasuryState>,

    /// The USDC mint
    pub usdc_mint: Account<'info, Mint>,

    /// Treasury USDC token account (ATA of treasury_state PDA)
    #[account(
        init,
        payer = authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = treasury_state,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_initialize(ctx: Context<Initialize>, mint_price: u64) -> Result<()> {
    let global = &mut ctx.accounts.global_state;
    global.authority = ctx.accounts.authority.key();
    global.total_souls_minted = 0;
    global.total_users = 0;
    global.treasury = ctx.accounts.treasury_state.key();
    global.mint_price = mint_price;
    global.paused = false;
    global.bump = ctx.bumps.global_state;

    let treasury = &mut ctx.accounts.treasury_state;
    treasury.total_collected = 0;
    treasury.total_withdrawn = 0;
    treasury.bump = ctx.bumps.treasury_state;

    Ok(())
}
