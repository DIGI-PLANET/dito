use anchor_lang::prelude::*;

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

    #[msg("Achievement period not yet complete")]
    PeriodNotComplete,          // 6013

    #[msg("Insufficient achievement rate for stage upgrade")]
    InsufficientAchievement,    // 6014

    #[msg("Activity already recorded for today")]
    AlreadyRecordedToday,       // 6015
}
