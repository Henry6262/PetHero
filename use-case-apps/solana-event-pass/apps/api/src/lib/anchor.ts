import {
	AnchorProvider,
	BN,
	Program,
	type Idl,
	Wallet,
} from "@coral-xyz/anchor";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
	Connection,
	Keypair,
	PublicKey,
	Transaction,
	TransactionInstruction,
	type Signer,
} from "@solana/web3.js";
import { config } from "../config.js";
import eventPassIdl from "./idl/event_pass.json" with { type: "json" };

export const connection = new Connection(config.SOLANA_RPC_URL, "confirmed");

const programId = new PublicKey(config.EVENT_PASS_PROGRAM_ID);

function getBackendWallet(): Wallet | null {
	const key = process.env.SOLANA_BACKEND_KEYPAIR_BASE58;
	if (!key) return null;
	try {
		return new Wallet(Keypair.fromSecretKey(Buffer.from(JSON.parse(key))));
	} catch {
		return new Wallet(Keypair.fromSecretKey(Buffer.from(key, "base64")));
	}
}

const backendWallet = getBackendWallet();

export const provider = new AnchorProvider(
	connection,
	backendWallet ?? (Keypair.generate() as unknown as Wallet),
	{ commitment: "confirmed" },
);

export const eventPassProgram = new Program(eventPassIdl as Idl, provider);

export function getEventPassProgramId(): PublicKey {
	return programId;
}

export interface EventPdas {
	eventState: PublicKey;
	eventAuthority: PublicKey;
	tokenMint: PublicKey;
	escrowUsdc: PublicKey;
}

export function deriveEventPdas(eventId: Buffer | Uint8Array): EventPdas {
	const seeds = {
		eventState: [Buffer.from("event_state"), Buffer.from(eventId)],
		eventAuthority: [Buffer.from("event_authority"), Buffer.from(eventId)],
		tokenMint: [Buffer.from("event_token_mint"), Buffer.from(eventId)],
		escrowUsdc: [Buffer.from("escrow_usdc"), Buffer.from(eventId)],
	};
	return {
		eventState: PublicKey.findProgramAddressSync(
			seeds.eventState,
			programId,
		)[0],
		eventAuthority: PublicKey.findProgramAddressSync(
			seeds.eventAuthority,
			programId,
		)[0],
		tokenMint: PublicKey.findProgramAddressSync(seeds.tokenMint, programId)[0],
		escrowUsdc: PublicKey.findProgramAddressSync(
			seeds.escrowUsdc,
			programId,
		)[0],
	};
}

export function getAssociatedTokenAccount(
	mint: PublicKey,
	owner: PublicKey,
): PublicKey {
	return getAssociatedTokenAddressSync(
		mint,
		owner,
		false,
		TOKEN_PROGRAM_ID,
		ASSOCIATED_TOKEN_PROGRAM_ID,
	);
}

export async function prepareTransaction(
	instructions: TransactionInstruction[],
	payer: PublicKey,
	signers: Signer[] = [],
): Promise<{
	transaction: Transaction;
	latestBlockhash: { blockhash: string; lastValidBlockHeight: number };
}> {
	const latestBlockhash = await connection.getLatestBlockhash();
	const transaction = new Transaction({
		feePayer: payer,
		...latestBlockhash,
	});
	transaction.add(...instructions);
	if (signers.length > 0) {
		transaction.partialSign(...signers);
	}
	return { transaction, latestBlockhash };
}

export function toBuffer16(input: string | Buffer | Uint8Array): Buffer {
	if (Buffer.isBuffer(input)) {
		if (input.length !== 16) throw new Error("Event ID must be 16 bytes");
		return input;
	}
	if (input instanceof Uint8Array) {
		if (input.length !== 16) throw new Error("Event ID must be 16 bytes");
		return Buffer.from(input);
	}
	// UUID -> 16 bytes (strip dashes and parse hex)
	const cleaned = input.replace(/-/g, "");
	if (cleaned.length === 32) {
		const buf = Buffer.from(cleaned, "hex");
		if (buf.length === 16) return buf;
	}
	const buf = Buffer.from(input, "hex");
	if (buf.length === 16) return buf;
	const utf8 = Buffer.from(input, "utf8");
	if (utf8.length <= 16) {
		const padded = Buffer.alloc(16);
		utf8.copy(padded);
		return padded;
	}
	throw new Error("Event ID must be a UUID, 16 bytes, or a valid hex string");
}

export { BN };
