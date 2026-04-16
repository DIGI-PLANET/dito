# DITO Soul — Anchor Program Design Document

> **Phase 2 Solana Program for DITO.guru**
> Version: 1.0 | Date: 2026-02-16
> Status: Design Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Program State & PDAs](#2-program-state--pdas)
3. [Instructions](#3-instructions)
4. [Events](#4-events)
5. [Error Codes](#5-error-codes)
6. [Security Considerations](#6-security-considerations)
7. [Integration with MVP](#7-integration-with-mvp)
8. [Deployment Plan](#8-deployment-plan)
9. [Cost Estimates](#9-cost-estimates)

---

## 1. Overview

**Program name:** `dito_soul`
**Framework:** Anchor v0.30+
**Network:** Solana (devnet → mainnet-beta)
**Purpose:** On-chain state management for DITO.guru's Soulbound Token (SBT) talent discovery platform. Users prove talents through diary entries, mint non-transferable NFTs, and progress through stages.

### Architecture Summary

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Next.js App    │────▶│  dito_soul       │────▶│  Metaplex   │
│  (Frontend)     │     │  (Anchor Program)│     │  (NFT Mint) │
└────────┬────────┘     └──────────────────┘     └─────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Supabase       │◀────│  Event Indexer   │
│  (Cache/Search) │     │  (Helius/Custom) │
└─────────────────┘     └──────────────────┘
```

### Key Design Decisions

- **Authority-gated writes:** Most mutations require authority signature (off-chain verification model)
- **Crank-based decay:** Anyone can trigger decay checks — incentivizable via small reward later
- **USDC payments:** Mint fees collected in USDC to treasury PDA (no SOL price volatility)
- **Metaplex NonTransferable:** SBT enforcement via Metaplex Token Standard (NonTransferable)

---

## 2. Program State & PDAs

### 2.1 PDA Seed Map

| Account | Seeds | Bump |
|---------|-------|------|
| GlobalState | `["global"]` | canonical |
| Treasury | `["treasury"]` | canonical |
| UserAccount | `["user", wallet_pubkey]` | canonical |
| SoulAccount | `["soul", wallet_pubkey, talent_hash]` | canonical |

### 2.2 GlobalState

```rust
#[account]
#[derive(InitSpace)]
pub struct GlobalState {
    /// Admin or multisig authority
    pub authority: Pubkey,
    /// Total SBTs minted across all users
    pub total_souls_minted: u64,
    /// Total registered users
    pub total_users: u64,
    /// Treasury PDA address (cached for convenience)
    pub treasury: Pubkey,
    /// Mint price in USDC smallest unit (6 decimals). $1 = 1_000_000
    pub mint_price: u64,
    /// Emergency pause flag
    pub paused: bool,
    /// Bump seed for this PDA
    pub bump: u8,
}
// Size: 32 + 8 + 8 + 32 + 8 + 1 + 1 = 90 bytes
// With discriminator: 8 + 90 = 98 bytes
```

### 2.3 Treasury

The Treasury PDA is a **token account** (USDC ATA) owned by the program, not a custom data account. We track collection stats in GlobalState or a small companion account:

```rust
#[account]
#[derive(InitSpace)]
pub struct TreasuryState {
    /// Total USDC collected (in smallest units)
    pub total_collected: u64,
    /// Total USDC withdrawn by authority
    pub total_withdrawn: u64,
    /// Bump seed
    pub bump: u8,
}
// Size: 8 + 8 + 8 + 1 = 25 bytes
```

The actual USDC is held in an Associated Token Account derived from the Treasury PDA:
- **Treasury PDA:** `["treasury"]` — signer for CPI transfers
- **Treasury USDC ATA:** standard ATA of the Treasury PDA for USDC mint

### 2.4 UserAccount

```rust
#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    /// User's wallet
    pub wallet: Pubkey,
    /// Display name (max 50 chars)
    #[max_len(50)]
    pub display_name: String,
    /// Number of active souls (max 255)
    pub souls_count: u8,
    /// Trust score (0–10000, representing 0.00–100.00)
    pub trust_score: u16,
    /// Unix timestamp of account creation
    pub created_at: i64,
    /// Strike count (3 = ban)
    pub strikes: u8,
    /// Real-name verified (required for Blazing+)
    pub verified: bool,
    /// Bump seed
    pub bump: u8,
}
// Size: 8 + 32 + (4 + 50) + 1 + 2 + 8 + 1 + 1 + 1 = 108 bytes
```

### 2.5 SoulAccount

```rust
/// Soul evolution stages
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum SoulStage {
    Sparked,   // 0 — newly minted, 7-day diary proof
    Burning,   // 1 — consistent practice
    Blazing,   // 2 — requires identity verification
    Radiant,   // 3 — expert level
    Eternal,   // 4 — lifetime achievement, immune to decay
}

#[account]
#[derive(InitSpace)]
pub struct SoulAccount {
    /// Owner wallet
    pub owner: Pubkey,
    /// Human-readable talent label
    #[max_len(100)]
    pub talent_label: String,
    /// SHA-256 of normalized talent_label (uniqueness key)
    pub talent_hash: [u8; 32],
    /// Descriptive traits (max 10 traits, each max 32 chars)
    #[max_len(10, 32)]
    pub traits: Vec<String>,
    /// Current evolution stage
    pub stage: SoulStage,
    /// Hash of off-chain proof bundle (diary entries, evidence)
    pub proof_hash: [u8; 32],
    /// Total diary entries recorded
    pub entries_count: u32,
    /// Current consecutive-day streak
    pub streak: u16,
    /// Last activity timestamp (for decay calculation)
    pub last_activity: i64,
    /// Mint timestamp
    pub mint_date: i64,
    /// Associated Metaplex NFT mint address
    pub nft_mint: Pubkey,
    /// Whether this soul has been decayed to dormant
    pub decayed: bool,
    /// Bump seed
    pub bump: u8,
}
// Size: 8 + 32 + (4+100) + 32 + (4 + 10*(4+32)) + 1 + 32 + 4 + 2 + 8 + 8 + 32 + 1 + 1
//     = 8 + 32 + 104 + 32 + 364 + 1 + 32 + 4 + 2 + 8 + 8 + 32 + 1 + 1 = 629 bytes
```

---

## 3. Instructions

### 3.1 `initialize`

Creates the GlobalState and TreasuryState PDAs. Called once at program deployment.

```rust
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

    /// The USDC mint (mainnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
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
    global.mint_price = mint_price; // default: 1_000_000 ($1 USDC)
    global.paused = false;
    global.bump = ctx.bumps.global_state;

    let treasury = &mut ctx.accounts.treasury_state;
    treasury.total_collected = 0;
    treasury.total_withdrawn = 0;
    treasury.bump = ctx.bumps.treasury_state;

    Ok(())
}
```

### 3.2 `create_user`

```rust
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
```

### 3.3 `mint_soul`

The most complex instruction. Handles payment, PDA creation, and Metaplex NFT minting.

```rust
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
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        seeds = [b"user", owner.key().as_ref()],
        bump = user_account.bump,
        constraint = user_account.wallet == owner.key(),
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        init,
        payer = owner,
        space = 8 + SoulAccount::INIT_SPACE,
        seeds = [b"soul", owner.key().as_ref(), talent_hash.as_ref()],
        bump,
    )]
    pub soul_account: Account<'info, SoulAccount>,

    // --- USDC Payment ---
    pub usdc_mint: Account<'info, Mint>,

    /// Owner's USDC token account
    #[account(
        mut,
        constraint = owner_usdc.owner == owner.key(),
        constraint = owner_usdc.mint == usdc_mint.key(),
    )]
    pub owner_usdc: Account<'info, TokenAccount>,

    /// Treasury USDC token account
    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury_state.bump,
    )]
    pub treasury_state: Account<'info, TreasuryState>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = treasury_state,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    // --- Metaplex NFT Mint (simplified; actual accounts depend on Metaplex version) ---
    /// CHECK: NFT mint account (created in this instruction)
    #[account(mut)]
    pub nft_mint: Signer<'info>,

    // ... additional Metaplex accounts (metadata, master_edition, etc.)

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    // pub metadata_program: Program<'info, Metadata>, // mpl_token_metadata
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

    // 3. Mint Metaplex NonTransferable NFT via CPI
    // (Implementation depends on mpl-token-metadata version)
    // Key fields:
    //   - token_standard: NonFungible
    //   - rule_set: NonTransferable (pNFT) OR use Delegate/Freeze approach
    //   - name: talent_label
    //   - symbol: "DITO"
    //   - uri: off-chain metadata JSON URL

    // 4. Initialize SoulAccount
    let now = Clock::get()?.unix_timestamp;
    let soul = &mut ctx.accounts.soul_account;
    soul.owner = ctx.accounts.owner.key();
    soul.talent_label = talent_label;
    soul.talent_hash = talent_hash;
    soul.traits = traits;
    soul.stage = SoulStage::Sparked;
    soul.proof_hash = proof_hash;
    soul.entries_count = 0;
    soul.streak = 0;
    soul.last_activity = now;
    soul.mint_date = now;
    soul.nft_mint = ctx.accounts.nft_mint.key();
    soul.decayed = false;
    soul.bump = ctx.bumps.soul_account;

    // 5. Update user & global stats
    let user = &mut ctx.accounts.user_account;
    user.souls_count = user.souls_count.checked_add(1).ok_or(DitoError::MaxSoulsReached)?;

    let global = &mut ctx.accounts.global_state;
    global.total_souls_minted = global.total_souls_minted.checked_add(1).unwrap();

    // 6. Emit event
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
```

### 3.4 `update_stage`

```rust
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

    // Blazing+ requires identity verification
    if new_stage as u8 >= SoulStage::Blazing as u8 {
        require!(user.verified, DitoError::UserNotVerified);
    }

    // Stage can only advance (not skip or go backwards via this instruction)
    require!(
        (new_stage.clone() as u8) == (soul.stage.clone() as u8) + 1,
        DitoError::InvalidStage
    );

    let old_stage = soul.stage.clone();
    soul.stage = new_stage.clone();
    let now = Clock::get()?.unix_timestamp;

    emit!(StageUpdated {
        soul: soul.key(),
        old_stage,
        new_stage,
        timestamp: now,
    });

    Ok(())
}
```

### 3.5 `apply_decay`

Permissionless crank — anyone can call this to decay inactive souls.

```rust
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
        SoulStage::Sparked  if elapsed_days >= 7  => (SoulStage::Sparked, true), // → Dormant (close)
        SoulStage::Burning  if elapsed_days >= 14 => (SoulStage::Sparked, false),
        SoulStage::Blazing  if elapsed_days >= 21 => (SoulStage::Burning, false),
        SoulStage::Radiant  if elapsed_days >= 30 => (SoulStage::Blazing, false),
        _ => return err!(DitoError::DecayNotEligible),
    };

    if should_close {
        // Mark as decayed — account can be closed and rent reclaimed
        soul.decayed = true;
        soul.streak = 0;

        let user = &mut ctx.accounts.user_account;
        user.souls_count = user.souls_count.saturating_sub(1);
    } else {
        soul.stage = new_stage.clone();
        soul.streak = 0; // Reset streak on decay
    }

    emit!(DecayApplied {
        soul: soul.key(),
        old_stage,
        new_stage: if should_close { SoulStage::Sparked } else { new_stage },
        timestamp: now,
    });

    Ok(())
}
```

**Decay Thresholds:**

| Current Stage | Inactivity Threshold | Result |
|---|---|---|
| Sparked | 7 days | → Dormant (account closed, rent reclaimed) |
| Burning | 14 days | → Sparked |
| Blazing | 21 days | → Burning |
| Radiant | 30 days | → Blazing |
| Eternal | ∞ | Immune |

### 3.6 `record_activity`

```rust
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
    let days_since_last = (now - soul.last_activity) / 86_400;

    soul.entries_count = soul.entries_count.checked_add(1).unwrap();
    soul.last_activity = now;

    // Streak: if activity within 48h, increment; otherwise reset
    if days_since_last <= 2 {
        soul.streak = soul.streak.saturating_add(1);
    } else {
        soul.streak = 1;
    }

    Ok(())
}
```

### 3.7 `apply_strike`

```rust
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

    // 3 strikes → all souls should be decayed (handled by separate crank or
    // by passing remaining soul accounts as remaining_accounts)
    if user.strikes >= 3 {
        user.souls_count = 0;
        user.trust_score = 0;
        // NOTE: Individual SoulAccount closure requires iterating remaining_accounts
        // or calling close_soul for each in a separate transaction from the frontend
    }

    Ok(())
}
```

### 3.8 `verify_identity`

```rust
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
```

### 3.9 `withdraw_treasury`

```rust
#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"global"],
        bump = global_state.bump,
        has_one = authority @ DitoError::NotAuthorized,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury_state.bump,
    )]
    pub treasury_state: Account<'info, TreasuryState>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = treasury_state,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    /// Destination: authority's USDC ATA
    #[account(
        mut,
        constraint = destination.owner == authority.key(),
        constraint = destination.mint == usdc_mint.key(),
    )]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury_state;

    // CPI transfer with PDA signer
    let seeds = &[b"treasury".as_ref(), &[treasury.bump]];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.treasury_state.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, amount)?;

    treasury.total_withdrawn = treasury.total_withdrawn.checked_add(amount).unwrap();

    Ok(())
}
```

### 3.10 `pause` / `unpause`

```rust
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
```

---

## 4. Events

```rust
#[event]
pub struct SoulMinted {
    pub wallet: Pubkey,
    pub talent_hash: [u8; 32],
    pub mint_address: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct StageUpdated {
    pub soul: Pubkey,
    pub old_stage: SoulStage,
    pub new_stage: SoulStage,
    pub timestamp: i64,
}

#[event]
pub struct DecayApplied {
    pub soul: Pubkey,
    pub old_stage: SoulStage,
    pub new_stage: SoulStage,
    pub timestamp: i64,
}

#[event]
pub struct StrikeApplied {
    pub wallet: Pubkey,
    pub strike_count: u8,
    pub timestamp: i64,
}

#[event]
pub struct PaymentReceived {
    pub wallet: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
```

**Indexing Strategy:** Use [Helius webhooks](https://docs.helius.dev/) or a custom geyser plugin to listen for these events and sync to Supabase for fast querying.

---

## 5. Error Codes

```rust
#[error_code]
pub enum DitoError {
    #[msg("Insufficient USDC payment")]
    InsufficientPayment,        // 6000

    #[msg("Maximum souls reached for this user")]
    MaxSoulsReached,            // 6001

    #[msg("Soul with this talent already exists")]
    SoulAlreadyExists,          // 6002

    #[msg("Invalid stage transition")]
    InvalidStage,               // 6003

    #[msg("Not authorized")]
    NotAuthorized,              // 6004

    #[msg("Program is paused")]
    ProgramPaused,              // 6005

    #[msg("User must be identity-verified for this stage")]
    UserNotVerified,            // 6006

    #[msg("Maximum strikes reached")]
    MaxStrikesReached,          // 6007

    #[msg("Display name too long")]
    NameTooLong,                // 6008

    #[msg("Too many traits (max 10)")]
    TooManyTraits,              // 6009

    #[msg("Soul has been decayed")]
    SoulDecayed,                // 6010

    #[msg("Eternal souls never decay")]
    EternalNeverDecays,         // 6011

    #[msg("Soul not eligible for decay yet")]
    DecayNotEligible,           // 6012
}
```

---

## 6. Security Considerations

### 6.1 Authority Management

| Phase | Authority Type | Details |
|-------|---------------|---------|
| Devnet | Single keypair | Developer wallet for rapid iteration |
| Testnet | 2-of-3 multisig | Squads v4 multisig |
| Mainnet | 3-of-5 multisig | Squads v4 with hardware wallets |

### 6.2 Signer & Account Checks

Every instruction enforces:
- **`has_one = authority`** on GlobalState for admin operations
- **Signer verification** via Anchor's `Signer<'info>` type
- **PDA ownership** validated by seed derivation (Anchor auto-checks)
- **Account discriminator** — 8-byte prefix (automatic with `#[account]`)
- **Rent-exempt** — Anchor enforces by default on `init`

### 6.3 Integer Safety

All arithmetic uses `.checked_add()`, `.checked_sub()`, `.saturating_add()` etc. Never use raw `+` / `-` operators.

### 6.4 PDA Seed Documentation

```
GlobalState:    seeds = [b"global"]
TreasuryState:  seeds = [b"treasury"]
UserAccount:    seeds = [b"user",  wallet.key().as_ref()]
SoulAccount:    seeds = [b"soul",  wallet.key().as_ref(), talent_hash.as_ref()]
```

### 6.5 Additional Hardening

- **Re-initialization guard:** `#[account(init)]` prevents double-init by default
- **Close account:** When decayed souls are reclaimed, use `#[account(close = destination)]`
- **USDC mint validation:** Hard-code expected USDC mint address as a constant and check
- **Upgrade authority:** Transfer to multisig; consider making immutable post-audit

```rust
// Constants
pub const USDC_MINT_DEVNET: &str = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
pub const USDC_MINT_MAINNET: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
pub const MAX_SOULS_PER_USER: u8 = 10;
```

---

## 7. Integration with MVP

### 7.1 Frontend Integration (Next.js)

```typescript
// lib/anchor/dito-soul.ts
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import { DitoSoul, IDL } from "./idl/dito_soul";

const PROGRAM_ID = new web3.PublicKey("DiTo...");

export function getProgram(provider: AnchorProvider): Program<DitoSoul> {
  return new Program(IDL, PROGRAM_ID, provider);
}

// Derive PDAs
export function getUserPDA(wallet: web3.PublicKey): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user"), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function getSoulPDA(
  wallet: web3.PublicKey,
  talentHash: Uint8Array
): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("soul"), wallet.toBuffer(), talentHash],
    PROGRAM_ID
  );
}

// Mint soul transaction
export async function mintSoul(
  program: Program<DitoSoul>,
  talentLabel: string,
  talentHash: number[],
  proofHash: number[],
  traits: string[]
) {
  const tx = await program.methods
    .mintSoul(talentLabel, talentHash, proofHash, traits)
    .accounts({
      owner: program.provider.publicKey,
      authority: AUTHORITY_PUBKEY,
      // ... all required accounts
    })
    .rpc();
  return tx;
}
```

### 7.2 Migration Path

```
Phase 1 (Current MVP)          Phase 2 (Anchor Program)
─────────────────────          ───────────────────────
Metaplex JS SDK directly  →    Anchor program wraps Metaplex CPI
Supabase = source of truth →   Solana = source of truth
No payment on-chain       →    USDC payment to Treasury PDA
No decay mechanics        →    On-chain decay via crank
```

**Migration Steps:**

1. Deploy `dito_soul` to devnet
2. Add Anchor client alongside existing Metaplex client
3. Feature-flag new minting flow (Anchor) vs old (direct Metaplex)
4. For existing SBTs: create SoulAccount PDAs retroactively via `backfill` admin instruction
5. Supabase becomes a read cache synced via Helius webhooks
6. Remove direct Metaplex calls once Anchor path is validated

### 7.3 Data Flow

```
User Action (diary entry)
  → Next.js API route validates content
  → Backend signs authority attestation
  → Calls record_activity on-chain
  → Helius webhook fires
  → Supabase updated (cache)
  → Frontend reads from Supabase (fast) with Solana verification (trust)
```

---

## 8. Deployment Plan

### 8.1 Devnet Testing

1. `anchor build && anchor deploy --provider.cluster devnet`
2. Run full test suite (`anchor test`)
3. Test all instructions with devnet USDC (faucet)
4. Load test with multiple users and souls
5. Test decay crank timing
6. Verify Metaplex NFT minting (non-transferable enforcement)

### 8.2 Security Audit Checklist

- [ ] All PDAs use canonical bumps (stored and re-derived)
- [ ] No missing signer checks
- [ ] No missing owner checks
- [ ] Integer overflow/underflow impossible (checked math)
- [ ] Close account drains lamports correctly
- [ ] No reinitialization possible
- [ ] Authority is validated on every privileged instruction
- [ ] USDC mint address is validated (not arbitrary SPL token)
- [ ] Pause flag checked on all user-facing mutations
- [ ] Event emission for all state changes
- [ ] No unchecked account deserialization
- [ ] PDA seeds don't collide across account types
- [ ] Consider formal audit (OtterSec, Neodyme, Sec3) before mainnet

### 8.3 Mainnet Deployment

1. Set up Squads 3-of-5 multisig
2. `anchor build --verifiable` (reproducible build)
3. Deploy to mainnet-beta with multisig as upgrade authority
4. Call `initialize` with mainnet USDC mint and $1 mint price
5. Verify program on Anchor registry / SolanaFM
6. Monitor first 50 mints closely
7. Consider making program immutable after 3-month observation period

---

## 9. Cost Estimates

### 9.1 Account Rent (at 6.96 SOL/byte/epoch ≈ 0.00000696 SOL/byte)

| Account | Size (bytes) | Rent-Exempt (SOL) | Rent-Exempt (USD @ $150/SOL) |
|---------|-------------|-------------------|------------------------------|
| GlobalState | 98 | ~0.00114 | ~$0.17 |
| TreasuryState | 25 | ~0.00089 | ~$0.13 |
| UserAccount | 108 | ~0.00122 | ~$0.18 |
| SoulAccount | 637 | ~0.00514 | ~$0.77 |

> Rent formula: `(128 + data_size) * 6960 / 1_000_000_000` SOL (approximate)

### 9.2 Transaction Fees

| Operation | Estimated Fee (SOL) | Notes |
|-----------|-------------------|-------|
| initialize | ~0.01 | One-time; creates 3 accounts |
| create_user | ~0.003 | PDA creation + rent |
| mint_soul | ~0.01 | PDA + Metaplex CPI + token transfer |
| record_activity | ~0.000005 | Simple account update |
| apply_decay | ~0.000005 | Simple account update |
| update_stage | ~0.000005 | Simple account update |

### 9.3 Total Cost per Mint

| Component | Cost |
|-----------|------|
| SoulAccount rent | ~0.005 SOL |
| Metaplex NFT (mint + metadata + master edition) | ~0.015 SOL |
| Transaction fee | ~0.00001 SOL |
| **Total SOL cost per mint** | **~0.02 SOL (~$3.00)** |
| USDC payment (user pays) | $1.00 |

> **Note:** The SOL costs (rent, tx fees) are paid by the minting user. The $1 USDC is the platform fee. At $150/SOL, the total user cost is approximately **$4.00** per soul mint ($3 rent/fees + $1 platform fee). Consider whether the platform subsidizes rent costs.

### 9.4 Scaling Projections

| Users | Souls (avg 2/user) | Total Rent (SOL) | Total Rent (USD) |
|-------|-------------------|------------------|-----------------|
| 100 | 200 | 1.15 | $172 |
| 1,000 | 2,000 | 11.5 | $1,725 |
| 10,000 | 20,000 | 115 | $17,250 |

---

## Appendix A: Program Module Structure

```
programs/dito-soul/
├── Cargo.toml
└── src/
    ├── lib.rs              # Program entrypoint, declare_id!, #[program] module
    ├── state/
    │   ├── mod.rs
    │   ├── global.rs       # GlobalState, TreasuryState
    │   ├── user.rs         # UserAccount
    │   └── soul.rs         # SoulAccount, SoulStage
    ├── instructions/
    │   ├── mod.rs
    │   ├── initialize.rs
    │   ├── create_user.rs
    │   ├── mint_soul.rs
    │   ├── update_stage.rs
    │   ├── apply_decay.rs
    │   ├── record_activity.rs
    │   ├── apply_strike.rs
    │   ├── verify_identity.rs
    │   ├── withdraw_treasury.rs
    │   └── pause.rs
    ├── events.rs
    └── errors.rs
```

## Appendix B: lib.rs Skeleton

```rust
use anchor_lang::prelude::*;

declare_id!("DiTo111111111111111111111111111111111111111");

pub mod state;
pub mod instructions;
pub mod events;
pub mod errors;

use instructions::*;

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
```

---

*Document authored for DITO.guru Phase 2. Ready for Anchor/Rust implementation.*
