use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::errors::EventPassError;
use crate::state::EventState;

#[derive(Accounts)]
#[instruction(event_id: [u8; 16])]
pub struct CreateTokenMint<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"event_state", event_id.as_ref()],
        bump,
        constraint = event_state.organizer == organizer.key() @ EventPassError::Unauthorized,
    )]
    pub event_state: Account<'info, EventState>,

    /// CHECK: PDA used as mint authority.
    #[account(
        seeds = [b"event_authority", event_id.as_ref()],
        bump = event_state.authority_bump,
    )]
    pub event_authority: AccountInfo<'info>,

    #[account(
        init,
        payer = organizer,
        mint::decimals = 6,
        mint::authority = event_authority,
        mint::freeze_authority = event_authority,
        seeds = [b"event_token_mint", event_id.as_ref()],
        bump
    )]
    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateTokenMint>, event_id: [u8; 16]) -> Result<()> {
    let event_state = &mut ctx.accounts.event_state;
    require!(event_state.event_id == event_id, EventPassError::InvalidEvent);
    event_state.token_mint = ctx.accounts.token_mint.key();
    msg!("Event token mint created: {}", ctx.accounts.token_mint.key());
    Ok(())
}
