use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer, FreezeAccount},
    metadata::{
        create_metadata_accounts_v3,
        create_master_edition_v3,
        CreateMetadataAccountsV3,
        CreateMasterEditionV3,
        Metadata,
        mpl_token_metadata::types::DataV2,
    },
};
use crate::state::*;
use crate::errors::DitoError;
use crate::events::{SoulMinted, PaymentReceived};

#[derive(Accounts)]
#[instruction(talent_label: String, talent_hash: [u8; 32], proof_hash: [u8; 32])]
pub struct MintSoul<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Authority co-signs to attest off-chain proof verification (7-day diary)
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"global"],
        bump = global_state.bump,
        has_one = authority @ DitoError::NotAuthorized,
        constraint = !global_state.paused @ DitoError::ProgramPaused,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [b"user", owner.key().as_ref()],
        bump = user_account.bump,
        constraint = user_account.wallet == owner.key(),
    )]
    pub user_account: Box<Account<'info, UserAccount>>,

    #[account(
        init,
        payer = owner,
        space = 8 + SoulAccount::INIT_SPACE,
        seeds = [b"soul", owner.key().as_ref(), talent_hash.as_ref()],
        bump,
    )]
    pub soul_account: Box<Account<'info, SoulAccount>>,

    // --- USDC Payment ---
    pub usdc_mint: Box<Account<'info, Mint>>,

    /// Owner's USDC token account
    #[account(
        mut,
        constraint = owner_usdc.owner == owner.key(),
        constraint = owner_usdc.mint == usdc_mint.key(),
    )]
    pub owner_usdc: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury_state.bump,
    )]
    pub treasury_state: Box<Account<'info, TreasuryState>>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = treasury_state,
    )]
    pub treasury_token_account: Box<Account<'info, TokenAccount>>,

    // --- NFT Mint ---
    /// New mint account for the Soul NFT (created in this tx)
    #[account(
        init,
        payer = owner,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority,
    )]
    pub nft_mint: Box<Account<'info, Mint>>,

    /// Owner's token account for the NFT
    #[account(
        init,
        payer = owner,
        associated_token::mint = nft_mint,
        associated_token::authority = owner,
    )]
    pub nft_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Metaplex metadata PDA — verified by metadata program
    #[account(
        mut,
        seeds = [
            b"metadata",
            metadata_program.key().as_ref(),
            nft_mint.key().as_ref(),
        ],
        bump,
        seeds::program = metadata_program.key(),
    )]
    pub metadata_account: UncheckedAccount<'info>,

    /// CHECK: Metaplex master edition PDA — verified by metadata program
    #[account(
        mut,
        seeds = [
            b"metadata",
            metadata_program.key().as_ref(),
            nft_mint.key().as_ref(),
            b"edition",
        ],
        bump,
        seeds::program = metadata_program.key(),
    )]
    pub master_edition: UncheckedAccount<'info>,

    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_mint_soul(
    ctx: Context<MintSoul>,
    talent_label: String,
    talent_hash: [u8; 32],
    proof_hash: [u8; 32],
    traits: Vec<String>,
) -> Result<()> {
    require!(talent_label.len() <= 100, DitoError::NameTooLong);
    require!(traits.len() <= 10, DitoError::TooManyTraits);

    let mint_price = ctx.accounts.global_state.mint_price;

    // 1. Transfer USDC from owner to treasury
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.owner_usdc.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, mint_price)?;

    // 2. Update treasury stats
    let treasury = &mut ctx.accounts.treasury_state;
    treasury.total_collected = treasury.total_collected.checked_add(mint_price).unwrap();

    // 3. Mint 1 NFT token to owner
    let mint_to_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.nft_mint.to_account_info(),
            to: ctx.accounts.nft_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::mint_to(mint_to_ctx, 1)?;

    // 4. Create Metaplex metadata
    let data = DataV2 {
        name: format!("DITO Soul: {}", talent_label),
        symbol: "DITO".to_string(),
        uri: String::new(), // Off-chain metadata URI set later via update
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.nft_mint.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(),
                payer: ctx.accounts.owner.to_account_info(),
                update_authority: ctx.accounts.authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        data,
        true,  // is_mutable (allow metadata URI update)
        true,  // update_authority_is_signer
        None,  // collection_details
    )?;

    // 5. Create master edition (limits supply to 1, makes it a true NFT)
    create_master_edition_v3(
        CpiContext::new(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMasterEditionV3 {
                edition: ctx.accounts.master_edition.to_account_info(),
                mint: ctx.accounts.nft_mint.to_account_info(),
                update_authority: ctx.accounts.authority.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(),
                metadata: ctx.accounts.metadata_account.to_account_info(),
                payer: ctx.accounts.owner.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        Some(0), // max_supply = 0 means no prints allowed
    )?;

    // 6. Freeze token account → Soulbound (non-transferable)
    let freeze_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        FreezeAccount {
            account: ctx.accounts.nft_token_account.to_account_info(),
            mint: ctx.accounts.nft_mint.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::freeze_account(freeze_ctx)?;

    // 7. Initialize SoulAccount
    let now = Clock::get()?.unix_timestamp;
    let soul = &mut ctx.accounts.soul_account;
    soul.owner = ctx.accounts.owner.key();
    soul.talent_label = talent_label;
    soul.talent_hash = talent_hash;
    soul.traits = traits;
    soul.stage = SoulStage::Sparked;
    soul.proof_hash = proof_hash;
    soul.entries_count = 0;
    soul.period_entries = 0;
    soul.period_start = now;
    soul.last_activity = now;
    soul.mint_date = now;
    soul.nft_mint = ctx.accounts.nft_mint.key();
    soul.decayed = false;
    soul.bump = ctx.bumps.soul_account;

    // 8. Update user & global stats
    let user = &mut ctx.accounts.user_account;
    user.souls_count = user.souls_count.checked_add(1).ok_or(DitoError::MaxSoulsReached)?;

    let global = &mut ctx.accounts.global_state;
    global.total_souls_minted = global.total_souls_minted.checked_add(1).unwrap();

    // 9. Emit events
    emit!(SoulMinted {
        wallet: ctx.accounts.owner.key(),
        talent_hash,
        mint_address: ctx.accounts.nft_mint.key(),
        timestamp: now,
    });

    emit!(PaymentReceived {
        wallet: ctx.accounts.owner.key(),
        amount: mint_price,
        timestamp: now,
    });

    Ok(())
}
