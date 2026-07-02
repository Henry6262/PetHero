use anchor_lang::prelude::*;

use crate::state::EventState;

#[derive(Accounts)]
#[instruction(event_id: [u8; 16])]
pub struct InitializeEvent<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,

    #[account(
        init,
        payer = organizer,
        space = EventState::LEN,
        seeds = [b"event_state", event_id.as_ref()],
        bump
    )]
    pub event_state: Account<'info, EventState>,

    /// CHECK: PDA used as mint authority and escrow owner.
    #[account(
        seeds = [b"event_authority", event_id.as_ref()],
        bump
    )]
    pub event_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeEvent>, event_id: [u8; 16]) -> Result<()> {
    let event_state = &mut ctx.accounts.event_state;
    event_state.event_id = event_id;
    event_state.organizer = ctx.accounts.organizer.key();
    event_state.token_mint = Pubkey::default();
    event_state.escrow_usdc = Pubkey::default();
    event_state.active = true;
    event_state.authority_bump = ctx.bumps.event_authority;

    msg!("Event initialized: {:?}", event_id);
    Ok(())
}
