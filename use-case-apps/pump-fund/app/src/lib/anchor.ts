import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import idl from '@/idl/pump_fund.json';

export const PROGRAM_ID = new PublicKey(idl.metadata.address);

export function getProgram(connection: Connection, wallet: any) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  return new Program(idl as any, provider);
}

export function getStatePDA() {
  return PublicKey.findProgramAddressSync([Buffer.from('state')], PROGRAM_ID);
}

export function getCampaignPDA(creator: PublicKey, campaignId: number) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('campaign'),
      creator.toBuffer(),
      new Uint8Array(new BigUint64Array([BigInt(campaignId)]).buffer),
    ],
    PROGRAM_ID
  );
}

export function getVaultPDA(campaign: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), campaign.toBuffer()],
    PROGRAM_ID
  );
}

export function getDonationPDA(campaign: PublicKey, donor: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('donation'), campaign.toBuffer(), donor.toBuffer()],
    PROGRAM_ID
  );
}
