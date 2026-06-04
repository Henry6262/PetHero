import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PumpFund } from '../target/types/pump_fund';
import { expect } from 'chai';

describe('pump-fund', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.PumpFund as Program<PumpFund>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = provider.wallet as anchor.Wallet;

  let statePDA: anchor.web3.PublicKey;
  let campaignPDA: anchor.web3.PublicKey;
  let vaultPDA: anchor.web3.PublicKey;
  let donationPDA: anchor.web3.PublicKey;

  before(async () => {
    [statePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('state')],
      program.programId
    );
  });

  it('Initializes the program state', async () => {
    await program.methods
      .initialize()
      .accounts({
        state: statePDA,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const state = await program.account.programState.fetch(statePDA);
    expect(state.authority.toBase58()).to.equal(payer.publicKey.toBase58());
    expect(state.platformFeeBps).to.equal(200);
    expect(state.campaignCounter.toNumber()).to.equal(0);
  });

  it('Creates a campaign', async () => {
    const state = await program.account.programState.fetch(statePDA);
    const campaignId = state.campaignCounter.toNumber();

    [campaignPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('campaign'),
        payer.publicKey.toBuffer(),
        new anchor.BN(campaignId).toArrayLike(Buffer, 'le', 8),
      ],
      program.programId
    );

    [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), campaignPDA.toBuffer()],
      program.programId
    );

    await program.methods
      .createCampaign(
        'Test Campaign',
        'A test campaign for PumpFund',
        'https://pump.fun/api/ipfs/test',
        new anchor.BN(anchor.web3.LAMPORTS_PER_SOL * 10),
        new anchor.BN(30)
      )
      .accounts({
        state: statePDA,
        campaign: campaignPDA,
        vault: vaultPDA,
        creator: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPDA);
    expect(campaign.name).to.equal('Test Campaign');
    expect(campaign.goal.toNumber()).to.equal(anchor.web3.LAMPORTS_PER_SOL * 10);
    expect(campaign.status).to.deep.equal({ active: {} });
  });

  it('Donates to a campaign', async () => {
    const donor = anchor.web3.Keypair.generate();

    // Airdrop SOL to donor
    const airdropSig = await provider.connection.requestAirdrop(
      donor.publicKey,
      anchor.web3.LAMPORTS_PER_SOL * 2
    );
    await provider.connection.confirmTransaction(airdropSig);

    [donationPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('donation'),
        campaignPDA.toBuffer(),
        donor.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .donate(new anchor.BN(anchor.web3.LAMPORTS_PER_SOL))
      .accounts({
        campaign: campaignPDA,
        vault: vaultPDA,
        donation: donationPDA,
        donor: donor.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([donor])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPDA);
    expect(campaign.raised.toNumber()).to.equal(anchor.web3.LAMPORTS_PER_SOL);

    const donation = await program.account.donation.fetch(donationPDA);
    expect(donation.amount.toNumber()).to.equal(anchor.web3.LAMPORTS_PER_SOL);
  });

  it('Launches token and distributes funds', async () => {
    const state = await program.account.programState.fetch(statePDA);
    const authority = state.authority;

    await program.methods
      .launchToken(anchor.web3.Keypair.generate().publicKey, [])
      .accounts({
        state: statePDA,
        campaign: campaignPDA,
        vault: vaultPDA,
        creator: payer.publicKey,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPDA);
    expect(campaign.status).to.deep.equal({ launched: {} });
    expect(campaign.raised.toNumber()).to.equal(anchor.web3.LAMPORTS_PER_SOL);
  });
});
