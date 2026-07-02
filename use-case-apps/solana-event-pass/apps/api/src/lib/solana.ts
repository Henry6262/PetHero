import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { config } from '../config.js';

export const connection = new Connection(
  config.SOLANA_RPC_URL,
  'confirmed',
);

export function getExplorerUrl(signature: string): string {
  const cluster = config.SOLANA_NETWORK === 'mainnet-beta' ? '' : `?cluster=${config.SOLANA_NETWORK}`;
  return `https://solscan.io/tx/${signature}${cluster}`;
}

export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

export async function confirmTransaction(signature: string, timeoutMs = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const status = await connection.getSignatureStatus(signature);
      if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
        return !status.value.err;
      }
    } catch {
      // ignore polling errors
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}
