import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import BN from 'bn.js';
import {
  PumpSdk,
  bondingCurvePda,
  getBuyTokenAmountFromSolAmount,
} from '@pump-fun/pump-sdk';

const pumpSdk = new PumpSdk();

export interface TokenConfig {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  creator: PublicKey;
  mayhemMode?: boolean;
  cashback?: boolean;
}

export interface LaunchResult {
  mint: string;
  txSignature: string;
  bondingCurve: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (retries <= 0) throw error;
    if (error instanceof Error && error.message?.includes('429')) {
      await new Promise((r) => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function createTokenOnPumpFun(
  connection: Connection,
  payer: Keypair,
  config: TokenConfig
): Promise<LaunchResult> {
  const mint = Keypair.generate();

  const createIx = await pumpSdk.createV2Instruction({
    mint: mint.publicKey,
    name: config.name.slice(0, 32),
    symbol: config.symbol.slice(0, 10),
    uri: config.imageUrl,
    creator: config.creator,
    user: payer.publicKey,
    mayhemMode: config.mayhemMode ?? false,
    cashback: config.cashback ?? false,
  });

  const tx = new Transaction().add(createIx);
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await withRetry(() => connection.getLatestBlockhash())).blockhash;
  tx.sign(payer, mint);

  const txSignature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  await connection.confirmTransaction(txSignature, 'confirmed');

  return {
    mint: mint.publicKey.toBase58(),
    txSignature,
    bondingCurve: bondingCurvePda(mint.publicKey).toBase58(),
  };
}

export interface Shareholder {
  address: PublicKey;
  shareBps: number;
}

export async function configureFeeSharing(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  shareholders: Shareholder[]
): Promise<string> {
  const total = shareholders.reduce((sum, s) => sum + s.shareBps, 0);
  if (total !== 10000) {
    throw new Error(`Fee shares must total 10,000 BPS (100%), got ${total}`);
  }

  const createSharingIx = await pumpSdk.createFeeSharingConfig({
    creator: payer.publicKey,
    mint,
    pool: null,
  });

  const updateSharesIx = await pumpSdk.updateFeeShares({
    authority: payer.publicKey,
    mint,
    currentShareholders: [],
    newShareholders: shareholders,
  });

  const sortedShareholders = [...shareholders].sort((a, b) =>
    a.address.toBase58().localeCompare(b.address.toBase58())
  );
  for (const sh of sortedShareholders) {
    updateSharesIx.keys.push({
      pubkey: sh.address,
      isSigner: false,
      isWritable: false,
    });
  }

  const tx = new Transaction().add(createSharingIx, updateSharesIx);
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await withRetry(() => connection.getLatestBlockhash())).blockhash;
  tx.sign(payer);

  const sig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

export async function uploadMetadata(params: {
  name: string;
  symbol: string;
  description: string;
  imageFile: File;
  twitter?: string;
  telegram?: string;
  website?: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append('name', params.name);
  formData.append('symbol', params.symbol);
  formData.append('description', params.description);
  formData.append('file', params.imageFile);

  if (params.twitter) formData.append('twitter', params.twitter);
  if (params.telegram) formData.append('telegram', params.telegram);
  if (params.website) formData.append('website', params.website);

  const response = await fetch('https://pump.fun/api/ipfs', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.metadataUri;
}
