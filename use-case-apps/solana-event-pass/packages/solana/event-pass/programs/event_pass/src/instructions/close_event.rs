use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use crate::errors::EventPassError;
use crate::state::EventState;

#[derive(Accounts)]
pub struct CloseEvent<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"event_state", event_state.event_id.as_ref()],
        bump,
        constraint = event_state.organizer == organizer.key() @ EventPassError::Unauthorized,
    )]
    pub event_state: Account<'info, EventState>,

    /// CHECK: PDA authority.
    #[account(
        seeds = [b"event_authority", event_state.event_id.as_ref()],
        bump = event_state.authority_bump,
    )]
    pub event_authority: AccountInfo<'info>,

    #[account(
        mut,
        constraint = escrow_usdc.key() == event_state.escrow_usdc
    )]
    pub escrow_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = organizer,
    )]
    pub organizer_usdc_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CloseEvent>) -> Result<()> {
    let event_id = ctx.accounts.event_state.event_id;
    let seeds = &[
        b"event_authority",
        event_id.as_ref(),
        &[ctx.accounts.event_state.authority_bump],
    ];
    let signer = &[&seeds[..]];

    let escrow_balance = ctx.accounts.escrow_usdc.amount;

    if escrow_balance > 0 {
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.escrow_usdc.to_account_info(),
            to: ctx.accounts.organizer_usdc_account.to_account_info(),
            authority: ctx.accounts.event_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, escrow_balance)?;
    }

    ctx.accounts.event_state.active = false;

    msg!("Event closed. Remaining {} USDC returned to organizer", escrow_balance);
    Ok(())
}
