use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub const PLATFORM_FEE_BPS: u16 = 200; // 2%
pub const MINIMUM_GOAL_LAMPORTS: u64 = 1_000_000_000; // 1 SOL
pub const CAMPAIGN_DURATION_DAYS: i64 = 30; // 30 days default

#[program]
pub mod pump_fund {
    use super::*;

    /// Initialize the program state with the deploying wallet as authority.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.platform_fee_bps = PLATFORM_FEE_BPS;
        state.campaign_counter = 0;
        state.bump = ctx.bumps.state;
        Ok(())
    }

    /// Create a new fundraising campaign.
    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        name: String,
        description: String,
        metadata_uri: String,
        goal: u64,
        duration_days: Option<i64>,
    ) -> Result<()> {
        require!(goal >= MINIMUM_GOAL_LAMPORTS, PumpFundError::GoalTooLow);
        require!(
            name.len() > 0 && name.len() <= 64,
            PumpFundError::InvalidName
        );
        require!(
            description.len() <= 500,
            PumpFundError::InvalidDescription
        );
        require!(
            metadata_uri.len() > 0 && metadata_uri.len() <= 256,
            PumpFundError::InvalidMetadataUri
        );

        let state = &mut ctx.accounts.state;
        let campaign = &mut ctx.accounts.campaign;
        let clock = Clock::get()?;

        let duration = duration_days.unwrap_or(CAMPAIGN_DURATION_DAYS);
        require!(duration > 0 && duration <= 90, PumpFundError::InvalidDuration);

        campaign.creator = ctx.accounts.creator.key();
        campaign.campaign_id = state.campaign_counter;
        campaign.name = name;
        campaign.description = description;
        campaign.metadata_uri = metadata_uri;
        campaign.goal = goal;
        campaign.raised = 0;
        campaign.deadline = clock.unix_timestamp + (duration * 86400);
        campaign.status = CampaignStatus::Active;
        campaign.mint = None;
        campaign.bump = ctx.bumps.campaign;
        campaign.vault_bump = ctx.bumps.vault;

        state.campaign_counter = state.campaign_counter.checked_add(1).unwrap();

        emit!(CampaignCreated {
            campaign_id: campaign.campaign_id,
            creator: campaign.creator,
            name: campaign.name.clone(),
            goal,
            deadline: campaign.deadline,
        });

        Ok(())
    }

    /// Donate SOL to an active campaign.
    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        require!(amount > 0, PumpFundError::InvalidAmount);

        let campaign = &mut ctx.accounts.campaign;
        let clock = Clock::get()?;

        require!(
            campaign.status == CampaignStatus::Active,
            PumpFundError::CampaignNotActive
        );
        require!(
            clock.unix_timestamp <= campaign.deadline,
            PumpFundError::CampaignExpired
        );

        // Transfer SOL from donor to campaign vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.donor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        // Update donation record
        let donation = &mut ctx.accounts.donation;
        if donation.donor == Pubkey::default() {
            donation.donor = ctx.accounts.donor.key();
            donation.campaign = campaign.key();
            donation.amount = 0;
            donation.bump = ctx.bumps.donation;
        }
        donation.amount = donation.amount.checked_add(amount).unwrap();

        // Update campaign total
        campaign.raised = campaign.raised.checked_add(amount).unwrap();

        emit!(DonationReceived {
            campaign_id: campaign.campaign_id,
            donor: donation.donor,
            amount,
            total_donated: donation.amount,
        });

        Ok(())
    }

    /// Launch the token and distribute raised funds to the creator.
    /// Top 3 donors are passed as remaining accounts for verification/logging.
    pub fn launch_token(
        ctx: Context<LaunchToken>,
        mint: Pubkey,
        top_donors: Vec<Pubkey>,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let state = &ctx.accounts.state;
        let clock = Clock::get()?;

        require!(
            campaign.status == CampaignStatus::Active,
            PumpFundError::CampaignNotActive
        );
        require!(
            campaign.creator == ctx.accounts.creator.key(),
            PumpFundError::Unauthorized
        );
        require!(
            clock.unix_timestamp <= campaign.deadline,
            PumpFundError::CampaignExpired
        );
        // Allow launch even if goal not met — creator discretion
        require!(
            top_donors.len() <= 3,
            PumpFundError::TooManyTopDonors
        );

        let raised = campaign.raised;
        let platform_fee = (raised as u128)
            .checked_mul(state.platform_fee_bps as u128)
            .unwrap()
            .checked_div(10_000)
            .unwrap() as u64;
        let creator_amount = raised.checked_sub(platform_fee).unwrap();

        // Transfer platform fee to authority
        if platform_fee > 0 {
            let vault_seeds = &[
                b"vault",
                campaign.key().as_ref(),
                &[campaign.vault_bump],
            ];
            let signer_seeds = &[&vault_seeds[..]];

            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.authority.to_account_info(),
                },
                signer_seeds,
            );
            system_program::transfer(cpi_context, platform_fee)?;
        }

        // Transfer remaining to creator
        if creator_amount > 0 {
            let vault_seeds = &[
                b"vault",
                campaign.key().as_ref(),
                &[campaign.vault_bump],
            ];
            let signer_seeds = &[&vault_seeds[..]];

            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
                signer_seeds,
            );
            system_program::transfer(cpi_context, creator_amount)?;
        }

        campaign.status = CampaignStatus::Launched;
        campaign.mint = Some(mint);

        emit!(TokenLaunched {
            campaign_id: campaign.campaign_id,
            mint,
            raised,
            platform_fee,
            creator_amount,
            top_donors,
        });

        Ok(())
    }

    /// Claim a refund if the campaign expired without launching.
    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let clock = Clock::get()?;

        require!(
            campaign.status == CampaignStatus::Active,
            PumpFundError::CampaignNotActive
        );
        require!(
            clock.unix_timestamp > campaign.deadline,
            PumpFundError::CampaignNotExpired
        );
        require!(
            campaign.raised < campaign.goal,
            PumpFundError::GoalReached
        );

        let donation = &ctx.accounts.donation;
        let refund_amount = donation.amount;
        require!(refund_amount > 0, PumpFundError::NoRefund);

        // Transfer from vault back to donor
        let vault_seeds = &[
            b"vault",
            campaign.key().as_ref(),
            &[campaign.vault_bump],
        ];
        let signer_seeds = &[&vault_seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.donor.to_account_info(),
            },
            signer_seeds,
        );
        system_program::transfer(cpi_context, refund_amount)?;

        campaign.raised = campaign.raised.checked_sub(refund_amount).unwrap();

        // Mark donation as refunded
        let donation = &mut ctx.accounts.donation;
        donation.amount = 0;

        emit!(RefundClaimed {
            campaign_id: campaign.campaign_id,
            donor: ctx.accounts.donor.key(),
            amount: refund_amount,
        });

        // If all refunded, mark campaign as failed
        if campaign.raised == 0 {
            campaign.status = CampaignStatus::Failed;
        }

        Ok(())
    }
}

// ─── Accounts ───────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramState::SIZE,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateCampaign<'info> {
    #[account(mut)]
    pub state: Account<'info, ProgramState>,
    #[account(
        init,
        payer = creator,
        space = 8 + Campaign::SIZE,
        seeds = [b"campaign", creator.key().as_ref(), &state.campaign_counter.to_le_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: Campaign vault PDA — holds SOL donations.
    #[account(
        init,
        payer = creator,
        space = 0,
        seeds = [b"vault", campaign.key().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Donate<'info> {
    #[account(
        mut,
        constraint = campaign.status == CampaignStatus::Active
    )]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: Campaign vault PDA.
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump = campaign.vault_bump
    )]
    pub vault: AccountInfo<'info>,
    #[account(
        init_if_needed,
        payer = donor,
        space = 8 + Donation::SIZE,
        seeds = [b"donation", campaign.key().as_ref(), donor.key().as_ref()],
        bump
    )]
    pub donation: Account<'info, Donation>,
    #[account(mut)]
    pub donor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LaunchToken<'info> {
    pub state: Account<'info, ProgramState>,
    #[account(
        mut,
        has_one = creator,
        constraint = campaign.status == CampaignStatus::Active
    )]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: Campaign vault PDA.
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump = campaign.vault_bump
    )]
    pub vault: AccountInfo<'info>,
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK: Platform authority receives fee.
    #[account(mut, address = state.authority)]
    pub authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(
        mut,
        constraint = campaign.status == CampaignStatus::Active
    )]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: Campaign vault PDA.
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump = campaign.vault_bump
    )]
    pub vault: AccountInfo<'info>,
    #[account(
        mut,
        has_one = donor,
        has_one = campaign,
        constraint = donation.amount > 0
    )]
    pub donation: Account<'info, Donation>,
    #[account(mut)]
    pub donor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ─── Data ───────────────────────────────────────────────────────────────────

#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub platform_fee_bps: u16,
    pub campaign_counter: u64,
    pub bump: u8,
}

impl ProgramState {
    pub const SIZE: usize = 32 + 2 + 8 + 1;
}

#[account]
pub struct Campaign {
    pub creator: Pubkey,
    pub campaign_id: u64,
    pub name: String,        // max 64
    pub description: String, // max 500
    pub metadata_uri: String, // max 256
    pub goal: u64,
    pub raised: u64,
    pub deadline: i64,
    pub status: CampaignStatus,
    pub mint: Option<Pubkey>,
    pub bump: u8,
    pub vault_bump: u8,
}

impl Campaign {
    pub const SIZE: usize = 32
        + 8
        + (4 + 64)
        + (4 + 500)
        + (4 + 256)
        + 8
        + 8
        + 8
        + 1
        + (1 + 32)
        + 1
        + 1;
}

#[account]
pub struct Donation {
    pub donor: Pubkey,
    pub campaign: Pubkey,
    pub amount: u64,
    pub bump: u8,
}

impl Donation {
    pub const SIZE: usize = 32 + 32 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum CampaignStatus {
    Active,
    Launched,
    Failed,
}

// ─── Errors ─────────────────────────────────────────────────────────────────

#[error_code]
pub enum PumpFundError {
    #[msg("Goal must be at least 1 SOL")]
    GoalTooLow,
    #[msg("Invalid campaign name")]
    InvalidName,
    #[msg("Invalid campaign description")]
    InvalidDescription,
    #[msg("Invalid metadata URI")]
    InvalidMetadataUri,
    #[msg("Invalid duration: must be between 1 and 90 days")]
    InvalidDuration,
    #[msg("Invalid donation amount")]
    InvalidAmount,
    #[msg("Campaign is not active")]
    CampaignNotActive,
    #[msg("Campaign has expired")]
    CampaignExpired,
    #[msg("Campaign has not expired yet")]
    CampaignNotExpired,
    #[msg("Campaign goal was reached — no refunds")]
    GoalReached,
    #[msg("No refund available")]
    NoRefund,
    #[msg("Only the campaign creator can perform this action")]
    Unauthorized,
    #[msg("Too many top donors specified (max 3)")]
    TooManyTopDonors,
}

// ─── Events ─────────────────────────────────────────────────────────────────

#[event]
pub struct CampaignCreated {
    pub campaign_id: u64,
    pub creator: Pubkey,
    pub name: String,
    pub goal: u64,
    pub deadline: i64,
}

#[event]
pub struct DonationReceived {
    pub campaign_id: u64,
    pub donor: Pubkey,
    pub amount: u64,
    pub total_donated: u64,
}

#[event]
pub struct TokenLaunched {
    pub campaign_id: u64,
    pub mint: Pubkey,
    pub raised: u64,
    pub platform_fee: u64,
    pub creator_amount: u64,
    pub top_donors: Vec<Pubkey>,
}

#[event]
pub struct RefundClaimed {
    pub campaign_id: u64,
    pub donor: Pubkey,
    pub amount: u64,
}
