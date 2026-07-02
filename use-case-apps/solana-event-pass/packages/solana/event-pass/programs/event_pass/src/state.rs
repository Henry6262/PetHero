use anchor_lang::prelude::*;

#[account]
pub struct EventState {
    /// Unique event identifier (UUID bytes, 16 bytes).
    pub event_id: [u8; 16],
    /// Organizer pubkey — can close the event.
    pub organizer: Pubkey,
    /// SPL token mint for this event's tokens.
    pub token_mint: Pubkey,
    /// USDC token account owned by the event authority (escrow).
    pub escrow_usdc: Pubkey,
    /// Whether the event is still active.
    pub active: bool,
    /// Bump seed for the event authority PDA.
    pub authority_bump: u8,
}

impl EventState {
    pub const LEN: usize = 8 + // discriminator
        16 +   // event_id
        32 +   // organizer
        32 +   // token_mint
        32 +   // escrow_usdc
        1 +    // active
        1; // authority_bump
}
