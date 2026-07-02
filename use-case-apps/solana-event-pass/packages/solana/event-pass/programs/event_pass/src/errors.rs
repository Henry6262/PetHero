use anchor_lang::prelude::*;

#[error_code]
pub enum EventPassError {
    #[msg("Event is not active")]
    EventInactive,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient event tokens")]
    InsufficientTokens,
    #[msg("Insufficient USDC in escrow")]
    InsufficientEscrow,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid event")]
    InvalidEvent,
}
