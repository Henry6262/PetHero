use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

pub use instructions::*;
pub use state::*;

declare_id!("EMJX3vXDX9uRyBoHj91LERVg7bRiwjsc6vprzoZDypjf");

#[program]
pub mod event_pass {
    use super::*;

    pub fn initialize_event(ctx: Context<InitializeEvent>, event_id: [u8; 16]) -> Result<()> {
        instructions::initialize_event::handler(ctx, event_id)
    }

    pub fn create_token_mint(ctx: Context<CreateTokenMint>, event_id: [u8; 16]) -> Result<()> {
        instructions::create_token_mint::handler(ctx, event_id)
    }

    pub fn create_escrow(ctx: Context<CreateEscrow>, event_id: [u8; 16]) -> Result<()> {
        instructions::create_escrow::handler(ctx, event_id)
    }

    pub fn top_up(ctx: Context<TopUp>, amount: u64) -> Result<()> {
        instructions::top_up::handler(ctx, amount)
    }

    pub fn pay_vendor(ctx: Context<PayVendor>, amount: u64) -> Result<()> {
        instructions::pay_vendor::handler(ctx, amount)
    }

    pub fn redeem_unused(ctx: Context<RedeemUnused>, amount: u64) -> Result<()> {
        instructions::redeem_unused::handler(ctx, amount)
    }

    pub fn close_event(ctx: Context<CloseEvent>) -> Result<()> {
        instructions::close_event::handler(ctx)
    }
}
