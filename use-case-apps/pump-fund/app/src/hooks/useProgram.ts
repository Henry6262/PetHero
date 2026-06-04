'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { getProgram, getStatePDA, getCampaignPDA, getVaultPDA, getDonationPDA } from '@/lib/anchor';
import { PublicKey } from '@solana/web3.js';

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    return getProgram(connection, wallet);
  }, [connection, wallet.publicKey, wallet.signTransaction]);

  return { program, connection, wallet };
}

export function usePDAs(creator?: PublicKey, campaignId?: number) {
  return useMemo(() => {
    const [statePDA] = getStatePDA();
    if (!creator || campaignId === undefined) {
      return { statePDA };
    }
    const [campaignPDA] = getCampaignPDA(creator, campaignId);
    const [vaultPDA] = getVaultPDA(campaignPDA);
    return { statePDA, campaignPDA, vaultPDA };
  }, [creator, campaignId]);
}

export function useDonationPDA(campaign: PublicKey, donor: PublicKey) {
  return useMemo(() => {
    const [donationPDA] = getDonationPDA(campaign, donor);
    return donationPDA;
  }, [campaign, donor]);
}
