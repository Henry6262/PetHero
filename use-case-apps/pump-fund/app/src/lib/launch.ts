/**
 * PumpFund — core launch + fee-share logic.
 *
 * Framework-agnostic so it runs in a Node script, an API route, or the browser.
 * Builds the atomic transaction that (1) creates the Pump.fun token, (2) creates
 * its fee-sharing config, and (3) locks the creator-fee split across the creator
 * + top backers. Signatures verified against @pump-fun/pump-sdk@1.36.0.
 *
 * On-chain rules enforced by the PumpFees program (we validate up-front to fail
 * fast with clear errors instead of an opaque revert):
 *   - 1..=10 shareholders
 *   - shares are basis points (BPS); 10_000 == 100%
 *   - all shares must sum to exactly 10_000
 *   - every share > 0
 *   - addresses unique
 *   - the split LOCKS PERMANENTLY on the first updateFeeShares — no later edits
 *   - token must be created with cashback:false or no creator fees accrue
 */
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { PumpSdk } from '@pump-fun/pump-sdk';

export const MAX_SHAREHOLDERS = 10;
export const TOTAL_BPS = 10_000;

export interface Shareholder {
  address: PublicKey;
  shareBps: number;
}

export interface DonorContribution {
  address: PublicKey;
  /** total contributed, in lamports (or any consistent unit) */
  amount: number;
}

/** Throws a descriptive error if the shareholder array would be rejected on-chain. */
export function validateShareholders(shareholders: Shareholder[]): void {
  if (shareholders.length < 1 || shareholders.length > MAX_SHAREHOLDERS) {
    throw new Error(
      `Need 1..${MAX_SHAREHOLDERS} shareholders, got ${shareholders.length} (TooManyShareholders).`,
    );
  }
  if (shareholders.some((s) => !Number.isInteger(s.shareBps) || s.shareBps <= 0)) {
    throw new Error('Every share must be a positive integer in BPS (ZeroShare).');
  }
  const total = shareholders.reduce((a, s) => a + s.shareBps, 0);
  if (total !== TOTAL_BPS) {
    throw new Error(`Shares must sum to ${TOTAL_BPS} BPS, got ${total} (InvalidShareTotal).`);
  }
  const unique = new Set(shareholders.map((s) => s.address.toBase58()));
  if (unique.size !== shareholders.length) {
    throw new Error('Duplicate shareholder address (DuplicateShareholder).');
  }
}

/**
 * Build the locked shareholder list: creator keeps `creatorBps`, the remaining
 * BPS are split across the top (10 - 1) donors proportionally to contribution.
 * Rounding remainder is added to the largest donor so the total is exactly 10_000.
 */
export function computeSplit(creator: PublicKey, creatorBps: number, donors: DonorContribution[]): Shareholder[] {
  if (creatorBps < 0 || creatorBps >= TOTAL_BPS) {
    throw new Error('creatorBps must be between 0 and 9_999.');
  }
  // top 9 donors, excluding the creator's own wallet
  const top = donors
    .filter((d) => !d.address.equals(creator) && d.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, MAX_SHAREHOLDERS - 1);

  if (top.length === 0) {
    // no eligible backers → creator takes everything
    return [{ address: creator, shareBps: TOTAL_BPS }];
  }

  const pool = TOTAL_BPS - creatorBps;
  const totalAmt = top.reduce((a, d) => a + d.amount, 0);

  const donorShares: Shareholder[] = top.map((d) => ({
    address: d.address,
    shareBps: Math.max(1, Math.floor((d.amount / totalAmt) * pool)),
  }));

  // fix rounding so creator + donors == 10_000 exactly (largest donor absorbs drift)
  const assigned = donorShares.reduce((a, s) => a + s.shareBps, 0);
  const drift = pool - assigned;
  donorShares[0].shareBps += drift;

  const result = [{ address: creator, shareBps: creatorBps }, ...donorShares];
  validateShareholders(result);
  return result;
}

export interface LaunchParams {
  authority: PublicKey; // creator + fee payer + signer
  mint: Keypair; // freshly generated mint keypair
  name: string;
  symbol: string;
  uri: string; // metadata JSON URI (IPFS)
  shareholders: Shareholder[];
}

/**
 * Assemble the atomic create → fee-config → lock transaction.
 * Caller signs with [authority, mint] and broadcasts.
 */
export async function buildLaunchAndLockTx(
  connection: Connection,
  params: LaunchParams,
): Promise<Transaction> {
  validateShareholders(params.shareholders);

  const sdk = new PumpSdk();

  const createIx = await sdk.createV2Instruction({
    mint: params.mint.publicKey,
    name: params.name.slice(0, 32),
    symbol: params.symbol.slice(0, 10),
    uri: params.uri,
    creator: params.authority,
    user: params.authority,
    mayhemMode: false,
    cashback: false, // REQUIRED: keep the creator fee pool so fee-sharing works
  });

  const configIx = await sdk.createFeeSharingConfig({
    creator: params.authority,
    mint: params.mint.publicKey,
    pool: null, // fresh token, still on the bonding curve (not graduated)
  });

  const lockIx = await sdk.updateFeeShares({
    authority: params.authority,
    mint: params.mint.publicKey,
    currentShareholders: [], // empty on first set
    newShareholders: params.shareholders, // <-- locks permanently
  });

  const tx = new Transaction()
    .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }))
    .add(createIx)
    .add(configIx)
    .add(lockIx);

  tx.feePayer = params.authority;
  tx.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;
  return tx;
}
