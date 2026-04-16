use anchor_lang::prelude::*;

// ── Constants ──────────────────────────────────────────────────────────────

pub const MAX_SOULS_PER_USER: u8 = 10;

// TODO: Update these for mainnet deployment
#[cfg(not(feature = "mainnet"))]
pub const USDC_MINT: &str = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // devnet
#[cfg(feature = "mainnet")]
pub const USDC_MINT: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // mainnet

// ── Enums ──────────────────────────────────────────────────────────────────

/// Soul evolution stages
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum SoulStage {
    Sparked,  // 0 — newly minted, 7-day diary proof
    Burning,  // 1 — consistent practice
    Blazing,  // 2 — requires identity verification
    Radiant,  // 3 — expert level
    Eternal,  // 4 — lifetime achievement, immune to decay
}

// ── Accounts ───────────────────────────────────────────────────────────────

/// Global program configuration. Seeds: ["global"]
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

/// Treasury statistics. Seeds: ["treasury"]
/// Actual USDC held in ATA of this PDA.
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

/// Per-user account. Seeds: ["user", wallet_pubkey]
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

/// Per-soul account. Seeds: ["soul", wallet_pubkey, talent_hash]
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
    /// Total diary entries recorded (lifetime)
    pub entries_count: u32,
    /// Activity count within current progression period
    pub period_entries: u16,
    /// Period start timestamp (reset on stage upgrade)
    pub period_start: i64,
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
