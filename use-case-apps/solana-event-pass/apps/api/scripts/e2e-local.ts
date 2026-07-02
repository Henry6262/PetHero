#!/usr/bin/env bun
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	SystemProgram,
	Transaction,
	sendAndConfirmTransaction,
} from "@solana/web3.js";
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
	createAssociatedTokenAccount,
	createMint,
	getAssociatedTokenAddressSync,
	mintTo,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { eq } from "drizzle-orm";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { db, pool } from "../src/db.js";
import * as schema from "@solana-event-pass/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../..");

// --- Env setup (must happen before ../src/config.js loads) ------------------
const RPC_URL = "http://localhost:8899";
const PROGRAM_ID =
	process.env.EVENT_PASS_PROGRAM_ID ||
	"EMJX3vXDX9uRyBoHj91LERVg7bRiwjsc6vprzoZDypjf";
const API_PORT = process.env.PORT || "3002";

process.env.SOLANA_RPC_URL = RPC_URL;
process.env.EVENT_PASS_PROGRAM_ID = PROGRAM_ID;
process.env.SOLANA_NETWORK = process.env.SOLANA_NETWORK || "devnet";
process.env.DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgres://postgres:postgres@localhost:15432/solana_event_pass";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
process.env.JWT_SECRET =
	process.env.JWT_SECRET ||
	"local-e2e-jwt-secret-must-be-at-least-32-characters-long";
process.env.PORT = API_PORT;

const SKIP_VALIDATOR = process.env.SEP_E2E_SKIP_VALIDATOR === "1";

// --- Helpers ----------------------------------------------------------------
function toBuffer16(input: string): Buffer {
	const cleaned = input.replace(/-/g, "");
	if (cleaned.length === 32) {
		const buf = Buffer.from(cleaned, "hex");
		if (buf.length === 16) return buf;
	}
	throw new Error(`Event ID must be a UUID: ${input}`);
}

async function waitForRpc(
	url: string,
	timeoutMs = 30_000,
): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "getHealth",
				}),
			});
			const json = await res.json();
			if (json.result === "ok") return true;
		} catch {
			// ignore
		}
		await sleep(500);
	}
	return false;
}

async function waitForApi(url: string, timeoutMs = 30_000): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(`${url}/health`);
			if (res.ok) return true;
		} catch {
			// ignore
		}
		await sleep(500);
	}
	return false;
}

function solanaBinPath(): string {
	const home = process.env.HOME || "/Users/henry";
	const active = `${home}/.local/share/solana/install/active_release/bin`;
	return `${active}:${process.env.PATH || ""}`;
}

async function spawnAndWait(
	cmd: string[],
	options?: { cwd?: string; env?: Record<string, string | undefined> },
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
	const proc = Bun.spawn(cmd, {
		cwd: options?.cwd || PROJECT_ROOT,
		env: options?.env as Record<string, string>,
		stdio: ["ignore", "pipe", "pipe"],
	});
	const decoder = new TextDecoder();
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { stdout, stderr, exitCode };
}

// --- Main --------------------------------------------------------------------
async function main() {
	const connection = new Connection(RPC_URL, "confirmed");

	const organizer = Keypair.generate();
	const attendee = Keypair.generate();
	const vendor = Keypair.generate();
	const funder = Keypair.generate();

	console.log("\n🧪 Solana Event Pass — local e2e test\n");
	console.log("Attendee:", attendee.publicKey.toBase58());
	console.log("Vendor:   ", vendor.publicKey.toBase58());
	console.log("Organizer:", organizer.publicKey.toBase58());
	console.log("Funder:   ", funder.publicKey.toBase58());

	let validator: ReturnType<typeof Bun.spawn> | null = null;
	const funderKeypairPath = "/tmp/sep-e2e-funder.json";
	await Bun.write(funderKeypairPath, JSON.stringify(Array.from(funder.secretKey)));

	async function airdropFunder(): Promise<void> {
		console.log("   Airdropping SOL to funder...");
		let lastErr: unknown;
		for (let attempt = 0; attempt < 15; attempt++) {
			try {
				const sig = await connection.requestAirdrop(
					funder.publicKey,
					10 * LAMPORTS_PER_SOL,
				);
				await connection.confirmTransaction(sig, "confirmed");
				console.log("   Airdrop confirmed");
				return;
			} catch (err) {
				lastErr = err;
				console.log("   airdrop attempt", attempt + 1, "failed, retrying...");
				await sleep(3_000);
			}
		}
		console.error(lastErr);
		throw new Error("Failed to airdrop SOL to funder");
	}

	async function fundParticipants(): Promise<void> {
		console.log("   Transferring SOL to organizer / attendee / vendor...");
		for (const kp of [organizer, attendee, vendor]) {
			const tx = new Transaction().add(
				SystemProgram.transfer({
					fromPubkey: funder.publicKey,
					toPubkey: kp.publicKey,
					lamports: 2 * LAMPORTS_PER_SOL,
				}),
			);
			await sendAndConfirmTransaction(connection, tx, [funder]);
		}
		console.log("✅ Participants funded");
	}

	try {
		// 1. Validator
		if (SKIP_VALIDATOR) {
			console.log("\n⏭️  SEP_E2E_SKIP_VALIDATOR=1 — using running validator");
			const healthy = await waitForRpc(RPC_URL);
			if (!healthy) throw new Error("No healthy validator on " + RPC_URL);
			await airdropFunder();
		} else {
			console.log("\n🚀 Starting Solana local validator...");
			validator = Bun.spawn(
				[
					"solana-test-validator",
					"--reset",
					"--rpc-port",
					"8899",
					"--quiet",
				],
				{
					cwd: PROJECT_ROOT,
					env: { ...process.env, PATH: solanaBinPath() },
					stdio: ["ignore", "ignore", "ignore"],
				},
			);
			const healthy = await waitForRpc(RPC_URL);
			if (!healthy) {
				throw new Error("Validator failed to become healthy");
			}
			console.log("✅ Validator ready");
			console.log("   waiting for faucet + feature set to stabilize...");
			await sleep(15_000);

			await airdropFunder();

			console.log("\n📦 Deploying event-pass program...");
			const { exitCode, stderr, stdout } = await spawnAndWait(
				[
					"solana",
					"program",
					"deploy",
					"--keypair",
					funderKeypairPath,
					"--program-id",
					resolve(
						PROJECT_ROOT,
						"packages/solana/event-pass/target/deploy/event_pass-keypair.json",
					),
					resolve(
						PROJECT_ROOT,
						"packages/solana/event-pass/target/deploy/event_pass.so",
					),
					"--url",
					RPC_URL,
				],
				{ env: { ...process.env, PATH: solanaBinPath() } },
			);
			if (exitCode !== 0) {
				console.error(stderr || stdout);
				throw new Error("Program deploy failed");
			}
			console.log("✅ Program deployed");
		}

		// 2. Fund participants
		console.log("\n💰 Funding participants...");
		await fundParticipants();

		// 3. Fake USDC mint + accounts
		console.log("\n🪙 Creating fake USDC mint...");
		const usdcMint = await createMint(
			connection,
			organizer,
			organizer.publicKey,
			null,
			6,
		);
		const attendeeUsdc = await createAssociatedTokenAccount(
			connection,
			organizer,
			usdcMint,
			attendee.publicKey,
		);
		const vendorUsdc = await createAssociatedTokenAccount(
			connection,
			organizer,
			usdcMint,
			vendor.publicKey,
		);
		await mintTo(
			connection,
			organizer,
			usdcMint,
			attendeeUsdc,
			organizer,
			1_000_000_000,
		);
		console.log("✅ USDC mint:", usdcMint.toBase58());

		process.env.USDC_MINT = usdcMint.toBase58();

		// 4. Load program
		const provider = new AnchorProvider(
			connection,
			new Wallet(organizer),
			{ commitment: "confirmed" },
		);
		const idlPath = resolve(
			PROJECT_ROOT,
			"packages/solana/event-pass/target/idl/event_pass.json",
		);
		const idl = await Bun.file(idlPath).json();
		const program = new Program(idl, provider);

		// 5. Find seeded event
		const event = await db.query.events.findFirst({
			where: eq(schema.events.name, "Blockchain Week Berlin 2026"),
		});
		if (!event) throw new Error("Seeded event not found");
		console.log("\n📅 Event:", event.name, event.id);

		const eventIdBuf = toBuffer16(event.id);
		const eventIdArray = Array.from(eventIdBuf);

		// 6. Initialize on-chain event assets
		console.log("\n🔗 Initializing event on-chain...");
		await program.methods
			.initializeEvent(eventIdArray)
			.accounts({ organizer: organizer.publicKey })
			.signers([organizer])
			.rpc();
		await program.methods
			.createTokenMint(eventIdArray)
			.accounts({ organizer: organizer.publicKey })
			.signers([organizer])
			.rpc();
		await program.methods
			.createEscrow(eventIdArray)
			.accounts({ organizer: organizer.publicKey, usdcMint })
			.signers([organizer])
			.rpc();
		console.log("✅ Event initialized, token mint + escrow created");

		const programId = new PublicKey(PROGRAM_ID);
		const [tokenMintPda] = PublicKey.findProgramAddressSync(
			[Buffer.from("event_token_mint"), eventIdBuf],
			programId,
		);
		const [escrowPda] = PublicKey.findProgramAddressSync(
			[Buffer.from("escrow_usdc"), eventIdBuf],
			programId,
		);

		// 7. Sync DB with real on-chain addresses
		const tokenRow = await db.query.eventTokens.findFirst({
			where: eq(schema.eventTokens.eventId, event.id),
		});
		if (!tokenRow) throw new Error("Event token row not found");

		await db
			.update(schema.eventTokens)
			.set({
				mintAddress: tokenMintPda.toBase58(),
				usdcEscrowAddress: escrowPda.toBase58(),
			})
			.where(eq(schema.eventTokens.id, tokenRow.id));

		const terminalRow = await db.query.terminals.findFirst({
			where: eq(schema.terminals.name, "Main Bar Terminal"),
		});
		if (!terminalRow) throw new Error("Terminal not found");

		await db
			.update(schema.terminals)
			.set({ walletAddress: vendor.publicKey.toBase58() })
			.where(eq(schema.terminals.id, terminalRow.id));

		console.log("✅ DB synced with on-chain addresses");

		// 8. Start API server
		console.log("\n🖥️  Starting API server on port", API_PORT, "...");
		const apiEnv = { ...process.env } as Record<string, string>;
		const apiProc = Bun.spawn(["bun", "apps/api/src/index.ts"], {
			cwd: PROJECT_ROOT,
			env: apiEnv,
			stdio: ["ignore", "ignore", "pipe"],
		});
		const apiHealthy = await waitForApi(`http://localhost:${API_PORT}`);
		if (!apiHealthy) {
			const stderr = await new Response(apiProc.stderr).text();
			console.error(stderr);
			throw new Error("API failed to start");
		}
		console.log("✅ API ready at http://localhost:" + API_PORT);

		const API = `http://localhost:${API_PORT}`;

		// 9. Wallet auth
		console.log("\n🔐 Authenticating attendee...");
		const nonceRes = await fetch(`${API}/auth/nonce`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ publicKey: attendee.publicKey.toBase58() }),
		});
		if (!nonceRes.ok) throw new Error("nonce request failed");
		const { nonce, message } = await nonceRes.json();
		const signature = bs58.encode(
			nacl.sign.detached(
				new TextEncoder().encode(message),
				attendee.secretKey,
			),
		);
		const verifyRes = await fetch(`${API}/auth/verify`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				publicKey: attendee.publicKey.toBase58(),
				signature,
				nonce,
			}),
		});
		if (!verifyRes.ok) throw new Error("auth verify failed");
		const { token, user } = await verifyRes.json();
		console.log("✅ Authenticated user:", user.id);

		// 10. Top-up flow
		console.log("\n⬆️  Top-up: 10 BBW26 tokens...");
		const topupRes = await fetch(`${API}/wallet/${event.id}/topup`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ amountTokens: "10", paymentMethod: "usdc" }),
		});
		if (!topupRes.ok) {
			const err = await topupRes.text();
			throw new Error(`Top-up order failed: ${err}`);
		}
		const { order } = await topupRes.json();
		console.log("   Order:", order.id);

		const txRes = await fetch(
			`${API}/wallet/orders/${order.id}/topup-transaction`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					walletAddress: attendee.publicKey.toBase58(),
				}),
			},
		);
		if (!txRes.ok) {
			const err = await txRes.text();
			throw new Error(`Top-up tx build failed: ${err}`);
		}
		const { transactionBase64 } = await txRes.json();

		const topUpTx = Transaction.from(
			Buffer.from(transactionBase64, "base64"),
		);
		topUpTx.partialSign(attendee);
		const topUpSig = await connection.sendRawTransaction(
			topUpTx.serialize(),
			{ skipPreflight: false, preflightCommitment: "confirmed" },
		);
		await connection.confirmTransaction(topUpSig, "confirmed");
		console.log("   On-chain top-up:", topUpSig);

		const verifyTopupRes = await fetch(
			`${API}/wallet/orders/${order.id}/verify-onchain`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ signature: topUpSig }),
			},
		);
		if (!verifyTopupRes.ok) {
			const err = await verifyTopupRes.text();
			throw new Error(`Top-up verify failed: ${err}`);
		}
		console.log("✅ Top-up verified");

		// 11. Check wallet balance
		const walletRes = await fetch(`${API}/wallet/${event.id}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const { wallet } = await walletRes.json();
		console.log("   Wallet balance:", wallet.balance, wallet.tokenSymbol);
		if (parseFloat(wallet.balance) !== 10) {
			throw new Error(`Expected balance 10, got ${wallet.balance}`);
		}

		// 12. Pay vendor flow
		console.log("\n💳 Payment: 2.5 BBW26 to vendor...");
		const payTxRes = await fetch(`${API}/payments/transaction`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				terminalId: terminalRow.id,
				amount: "2.5",
				attendeePublicKey: attendee.publicKey.toBase58(),
			}),
		});
		if (!payTxRes.ok) {
			const err = await payTxRes.text();
			throw new Error(`Payment tx build failed: ${err}`);
		}
		const payTxJson = await payTxRes.json();
		const payTx = Transaction.from(
			Buffer.from(payTxJson.transactionBase64, "base64"),
		);
		payTx.partialSign(attendee);
		const paySig = await connection.sendRawTransaction(payTx.serialize(), {
			skipPreflight: false,
			preflightCommitment: "confirmed",
		});
		await connection.confirmTransaction(paySig, "confirmed");
		console.log("   On-chain payment:", paySig);

		const verifyPayRes = await fetch(`${API}/payments/verify`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				signature: paySig,
				terminalId: terminalRow.id,
				eventTokenId: payTxJson.eventTokenId,
				amount: "2.5",
			}),
		});
		if (!verifyPayRes.ok) {
			const err = await verifyPayRes.text();
			throw new Error(`Payment verify failed: ${err}`);
		}
		console.log("✅ Payment verified");

		// 13. Final balance check
		const finalWalletRes = await fetch(`${API}/wallet/${event.id}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const { wallet: finalWallet } = await finalWalletRes.json();
		console.log("   Final balance:", finalWallet.balance, finalWallet.tokenSymbol);
		if (parseFloat(finalWallet.balance) !== 7.5) {
			throw new Error(`Expected final balance 7.5, got ${finalWallet.balance}`);
		}

		const vendorUsdcAccountInfo = await connection.getTokenAccountBalance(
			vendorUsdc,
		);
		console.log(
			"   Vendor USDC balance:",
			vendorUsdcAccountInfo.value.uiAmount,
			"USDC",
		);
		if (vendorUsdcAccountInfo.value.uiAmount !== 2.5) {
			throw new Error(
				`Expected vendor USDC 2.5, got ${vendorUsdcAccountInfo.value.uiAmount}`,
			);
		}

		console.log("\n🎉 Local end-to-end flow passed!\n");

		// Cleanup and exit hard so lingering web3.js websockets don't hang the process
		apiProc.kill("SIGTERM");
		await apiProc.exited;
		if (validator) {
			validator.kill("SIGTERM");
			await validator.exited;
		}
		await pool.end();
		process.exit(0);
	} catch (err) {
		console.error("\n❌ E2E test failed:", err);
		process.exitCode = 1;
	} finally {
		if (validator) {
			validator.kill("SIGTERM");
			await validator.exited;
		}
		await pool.end();
	}
}

main();
