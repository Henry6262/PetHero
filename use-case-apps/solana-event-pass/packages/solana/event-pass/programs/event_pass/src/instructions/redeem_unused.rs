use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use crate::errors::EventPassError;
use crate::state::EventState;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct RedeemUnused<'info> {
    #[account(mut)]
    pub attendee: Signer<'info>,

    #[account(
        seeds = [b"event_state", event_state.event_id.as_ref()],
        bump,
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
        constraint = token_mint.key() == event_state.token_mint
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = escrow_usdc.key() == event_state.escrow_usdc
    )]
    pub escrow_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = event_state.token_mint,
        token::authority = attendee,
    )]
    pub attendee_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = attendee,
    )]
    pub attendee_usdc_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RedeemUnused>, amount: u64) -> Result<()> {
    require!(amount > 0, EventPassError::InvalidAmount);

    let event_id = ctx.accounts.event_state.event_id;
    let seeds = &[
        b"event_authority",
        event_id.as_ref(),
        &[ctx.accounts.event_state.authority_bump],
    ];
    let signer = &[&seeds[..]];

    // 1. Burn event tokens from attendee.
    let cpi_accounts = token::Burn {
        mint: ctx.accounts.token_mint.to_account_info(),
        from: ctx.accounts.attendee_token_account.to_account_info(),
        authority: ctx.accounts.attendee.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::burn(cpi_ctx, amount)?;

    // 2. Return USDC from escrow to attendee.
    let cpi_accounts = token::Transfer {
        from: ctx.accounts.escrow_usdc.to_account_info(),
        to: ctx.accounts.attendee_usdc_account.to_account_info(),
        authority: ctx.accounts.event_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    token::transfer(cpi_ctx, amount)?;

    msg!("Redeem unused: {} tokens burned, {} USDC returned", amount, amount);
    Ok(())
}
