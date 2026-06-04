/**
 * Devnet proof: create a Pump.fun token + lock a creator-fee split across
 * 3 wallets, then read it back on-chain. Proves the core PumpFund mechanic.
 *
 * Run:  npx tsx scripts/prove-feeshare.ts
 * A keypair is persisted to scripts/.prove-keypair.json (gitignored). Fund that
 * address with a little devnet SOL if the airdrop is rate-limited.
 */
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';
import { feeSharingConfigPda } from '@pump-fun/pump-sdk';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { buildLaunchAndLockTx, validateShareholders, type Shareholder } from '../src/lib/launch';

const RPC = process.env.DEVNET_RPC || 'https://api.devnet.solana.com';
const KEYPATH = new URL('./.prove-keypair.json', import.meta.url);

function loadKeypair(): Keypair {
  if (existsSync(KEYPATH)) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(KEYPATH, 'utf8'))));
  }
  const kp = Keypair.generate();
  writeFileSync(KEYPATH, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}

async function main() {
  const conn = new Connection(RPC, 'confirmed');
  const authority = loadKeypair();
  console.log('authority:', authority.publicKey.toBase58());

  let bal = await conn.getBalance(authority.publicKey);
  console.log('balance:', bal / 1e9, 'SOL');
  if (bal < 0.05e9) {
    console.log('requesting airdrop…');
    try {
      const sig = await conn.requestAirdrop(authority.publicKey, 1e9);
      await conn.confirmTransaction(sig, 'confirmed');
      bal = await conn.getBalance(authority.publicKey);
      console.log('new balance:', bal / 1e9, 'SOL');
    } catch (e) {
      console.error('Airdrop failed (rate-limited). Fund this address on devnet and re-run:');
      console.error('  ', authority.publicKey.toBase58());
      process.exit(1);
    }
  }

  const mint = Keypair.generate();
  const backer1 = Keypair.generate().publicKey;
  const backer2 = Keypair.generate().publicKey;

  const shareholders: Shareholder[] = [
    { address: authority.publicKey, shareBps: 4000 }, // creator 40%
    { address: backer1, shareBps: 3500 }, // #1 backer 35%
    { address: backer2, shareBps: 2500 }, // #2 backer 25%
  ];
  validateShareholders(shareholders);
  console.log('mint:', mint.publicKey.toBase58());
  console.log('split:', shareholders.map((s) => `${s.shareBps / 100}%`).join(' / '));

  const tx = await buildLaunchAndLockTx(conn, {
    authority: authority.publicKey,
    mint,
    name: 'PumpFund Proof',
    symbol: 'PROOF',
    uri: 'https://pumpfund.example/proof.json',
    shareholders,
  });

  console.log('sending create → fee-config → lock …');
  const sig = await sendAndConfirmTransaction(conn, tx, [authority, mint], {
    commitment: 'confirmed',
  });
  console.log('✓ tx:', sig);
  console.log('  https://solscan.io/tx/' + sig + '?cluster=devnet');

  // read back: the sharing-config account must now exist on-chain
  const configPda = feeSharingConfigPda(mint.publicKey);
  console.log('sharing config PDA:', configPda.toBase58());
  const info = await conn.getAccountInfo(configPda);
  if (info) {
    console.log(`✓ sharing-config exists on-chain (${info.data.length} bytes, owner ${info.owner.toBase58()})`);
    console.log('✓ split locked: updateFeeShares succeeded in the tx above');
  } else {
    console.log('⚠ sharing-config account not found — check the tx');
  }
}

main().catch((e) => {
  console.error('FAILED:', e?.message || e);
  process.exit(1);
});
