use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::errors::EventPassError;
use crate::state::EventState;

#[derive(Accounts)]
#[instruction(event_id: [u8; 16])]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"event_state", event_id.as_ref()],
        bump,
        constraint = event_state.organizer == organizer.key() @ EventPassError::Unauthorized,
    )]
    pub event_state: Account<'info, EventState>,

    /// CHECK: PDA used as escrow authority.
    #[account(
        seeds = [b"event_authority", event_id.as_ref()],
        bump = event_state.authority_bump,
    )]
    pub event_authority: AccountInfo<'info>,

    /// CHECK: USDC mint (verified by the escrow account constraint).
    pub usdc_mint: AccountInfo<'info>,

    #[account(
        init,
        payer = organizer,
        token::mint = usdc_mint,
        token::authority = event_authority,
        seeds = [b"escrow_usdc", event_id.as_ref()],
        bump
    )]
    pub escrow_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateEscrow>, event_id: [u8; 16]) -> Result<()> {
    let event_state = &mut ctx.accounts.event_state;
    require!(event_state.event_id == event_id, EventPassError::InvalidEvent);
    event_state.escrow_usdc = ctx.accounts.escrow_usdc.key();
    msg!("Event escrow created: {}", ctx.accounts.escrow_usdc.key());
    Ok(())
}
