import { PublicKey } from '@solana/web3.js';

export interface Campaign {
  creator: PublicKey;
  campaignId: number;
  name: string;
  description: string;
  metadataUri: string;
  goal: number;
  raised: number;
  deadline: number;
  status: CampaignStatus;
  mint: PublicKey | null;
  bump: number;
  vaultBump: number;
  publicKey: PublicKey;
}

export type CampaignStatus = 'active' | 'launched' | 'failed';

export interface DonationRecord {
  donor: PublicKey;
  campaign: PublicKey;
  amount: number;
  bump: number;
}

export interface CampaignFormData {
  name: string;
  symbol: string;
  description: string;
  goal: number;
  durationDays: number;
  image: File | null;
  twitter?: string;
  telegram?: string;
  website?: string;
}
