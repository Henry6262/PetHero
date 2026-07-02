use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use crate::errors::EventPassError;
use crate::state::EventState;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct TopUp<'info> {
    #[account(mut)]
    pub attendee: Signer<'info>,

    #[account(
        seeds = [b"event_state", event_state.event_id.as_ref()],
        bump,
        constraint = event_state.active @ EventPassError::EventInactive,
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

pub fn handler(ctx: Context<TopUp>, amount: u64) -> Result<()> {
    require!(amount > 0, EventPassError::InvalidAmount);

    // 1. Transfer USDC from attendee to escrow.
    let cpi_accounts = token::Transfer {
        from: ctx.accounts.attendee_usdc_account.to_account_info(),
        to: ctx.accounts.escrow_usdc.to_account_info(),
        authority: ctx.accounts.attendee.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // 2. Mint event tokens to attendee.
    let event_id = ctx.accounts.event_state.event_id;
    let seeds = &[
        b"event_authority",
        event_id.as_ref(),
        &[ctx.accounts.event_state.authority_bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = token::MintTo {
        mint: ctx.accounts.token_mint.to_account_info(),
        to: ctx.accounts.attendee_token_account.to_account_info(),
        authority: ctx.accounts.event_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    token::mint_to(cpi_ctx, amount)?;

    msg!("Top up: {} event tokens minted", amount);
    Ok(())
}
