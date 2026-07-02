import {
	createAssociatedTokenAccountInstruction,
	getAccount,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
	connection,
	deriveEventPdas,
	eventPassProgram,
	getAssociatedTokenAccount,
	prepareTransaction,
	toBuffer16,
	type EventPdas,
} from "../lib/anchor.js";

export interface BuildTxResult {
	transactionBase64: string;
	latestBlockhash: { blockhash: string; lastValidBlockHeight: number };
}

function eventIdToArray(eventId: string | Buffer | Uint8Array): number[] {
	return Array.from(toBuffer16(eventId));
}

async function ensureAtaInstruction(
	mint: PublicKey,
	owner: PublicKey,
	payer: PublicKey,
): Promise<TransactionInstruction[]> {
	const ata = getAssociatedTokenAccount(mint, owner);
	try {
		await getAccount(connection, ata, "confirmed", TOKEN_PROGRAM_ID);
		return [];
	} catch {
		return [
			createAssociatedTokenAccountInstruction(
				payer,
				ata,
				owner,
				mint,
				TOKEN_PROGRAM_ID,
			),
		];
	}
}

export async function buildInitializeEventTx(
	eventId: string | Buffer | Uint8Array,
	organizerPublicKey: string,
): Promise<BuildTxResult> {
	const organizer = new PublicKey(organizerPublicKey);
	const ix = await eventPassProgram.methods
		.initializeEvent(eventIdToArray(eventId))
		.accounts({
			organizer,
		})
		.instruction();
	const { transaction, latestBlockhash } = await prepareTransaction(
		[ix],
		organizer,
	);
	return {
		transactionBase64: transaction
			.serialize({ requireAllSignatures: false })
			.toString("base64"),
		latestBlockhash,
	};
}

export async function buildCreateEventAssetsTx(
	eventId: string | Buffer | Uint8Array,
	organizerPublicKey: string,
	usdcMint: string,
): Promise<BuildTxResult> {
	const organizer = new PublicKey(organizerPublicKey);
	const usdcMintPubkey = new PublicKey(usdcMint);

	const createMintIx = await eventPassProgram.methods
		.createTokenMint(eventIdToArray(eventId))
		.accounts({
			organizer,
		})
		.instruction();

	const createEscrowIx = await eventPassProgram.methods
		.createEscrow(eventIdToArray(eventId))
		.accounts({
			organizer,
			usdcMint: usdcMintPubkey,
		})
		.instruction();

	const { transaction, latestBlockhash } = await prepareTransaction(
		[createMintIx, createEscrowIx],
		organizer,
	);
	return {
		transactionBase64: transaction
			.serialize({ requireAllSignatures: false })
			.toString("base64"),
		latestBlockhash,
	};
}

export async function buildTopUpTx(
	eventId: string | Buffer | Uint8Array,
	attendeePublicKey: string,
	amountBaseUnits: number | string,
	usdcMint: string,
): Promise<BuildTxResult> {
	const attendee = new PublicKey(attendeePublicKey);
	const usdcMintPubkey = new PublicKey(usdcMint);
	const pdas = deriveEventPdas(toBuffer16(eventId));

	const instructions: TransactionInstruction[] = [];
	instructions.push(
		...(await ensureAtaInstruction(pdas.tokenMint, attendee, attendee)),
	);
	instructions.push(
		...(await ensureAtaInstruction(usdcMintPubkey, attendee, attendee)),
	);

	const attendeeTokenAccount = getAssociatedTokenAccount(
		pdas.tokenMint,
		attendee,
	);
	const attendeeUsdcAccount = getAssociatedTokenAccount(
		usdcMintPubkey,
		attendee,
	);

	const topUpIx = await eventPassProgram.methods
		.topUp(new BN(amountBaseUnits.toString()))
		.accounts({
			attendee,
			eventState: pdas.eventState,
			tokenMint: pdas.tokenMint,
			escrowUsdc: pdas.escrowUsdc,
			attendeeTokenAccount,
			attendeeUsdcAccount,
			usdcMint: usdcMintPubkey,
		})
		.instruction();
	instructions.push(topUpIx);

	const { transaction, latestBlockhash } = await prepareTransaction(
		instructions,
		attendee,
	);
	return {
		transactionBase64: transaction
			.serialize({ requireAllSignatures: false })
			.toString("base64"),
		latestBlockhash,
	};
}

export async function buildPayVendorTx(
	eventId: string | Buffer | Uint8Array,
	attendeePublicKey: string,
	vendorPublicKey: string,
	amountBaseUnits: number | string,
	usdcMint: string,
): Promise<BuildTxResult> {
	const attendee = new PublicKey(attendeePublicKey);
	const vendor = new PublicKey(vendorPublicKey);
	const usdcMintPubkey = new PublicKey(usdcMint);
	const pdas = deriveEventPdas(toBuffer16(eventId));

	const instructions: TransactionInstruction[] = [];
	instructions.push(
		...(await ensureAtaInstruction(usdcMintPubkey, vendor, attendee)),
	);

	const attendeeTokenAccount = getAssociatedTokenAccount(
		pdas.tokenMint,
		attendee,
	);
	const vendorUsdcAccount = getAssociatedTokenAccount(usdcMintPubkey, vendor);
	const attendeeUsdcAccount = getAssociatedTokenAccount(
		usdcMintPubkey,
		attendee,
	);

	const payVendorIx = await eventPassProgram.methods
		.payVendor(new BN(amountBaseUnits.toString()))
		.accounts({
			attendee,
			eventState: pdas.eventState,
			tokenMint: pdas.tokenMint,
			escrowUsdc: pdas.escrowUsdc,
			attendeeTokenAccount,
			vendor,
			vendorUsdcAccount,
			attendeeUsdcAccount,
			usdcMint: usdcMintPubkey,
		})
		.instruction();
	instructions.push(payVendorIx);

	const { transaction, latestBlockhash } = await prepareTransaction(
		instructions,
		attendee,
	);
	return {
		transactionBase64: transaction
			.serialize({ requireAllSignatures: false })
			.toString("base64"),
		latestBlockhash,
	};
}

export async function buildRedeemUnusedTx(
	eventId: string | Buffer | Uint8Array,
	attendeePublicKey: string,
	amountBaseUnits: number | string,
	usdcMint: string,
): Promise<BuildTxResult> {
	const attendee = new PublicKey(attendeePublicKey);
	const usdcMintPubkey = new PublicKey(usdcMint);
	const pdas = deriveEventPdas(toBuffer16(eventId));

	const attendeeTokenAccount = getAssociatedTokenAccount(
		pdas.tokenMint,
		attendee,
	);
	const attendeeUsdcAccount = getAssociatedTokenAccount(
		usdcMintPubkey,
		attendee,
	);

	const redeemIx = await eventPassProgram.methods
		.redeemUnused(new BN(amountBaseUnits.toString()))
		.accounts({
			attendee,
			eventState: pdas.eventState,
			tokenMint: pdas.tokenMint,
			escrowUsdc: pdas.escrowUsdc,
			attendeeTokenAccount,
			attendeeUsdcAccount,
			usdcMint: usdcMintPubkey,
		})
		.instruction();

	const { transaction, latestBlockhash } = await prepareTransaction(
		[redeemIx],
		attendee,
	);
	return {
		transactionBase64: transaction
			.serialize({ requireAllSignatures: false })
			.toString("base64"),
		latestBlockhash,
	};
}

export async function buildCloseEventTx(
	eventId: string | Buffer | Uint8Array,
	organizerPublicKey: string,
	usdcMint: string,
): Promise<BuildTxResult> {
	const organizer = new PublicKey(organizerPublicKey);
	const usdcMintPubkey = new PublicKey(usdcMint);
	const pdas = deriveEventPdas(toBuffer16(eventId));

	const organizerUsdcAccount = getAssociatedTokenAccount(
		usdcMintPubkey,
		organizer,
	);

	const closeIx = await eventPassProgram.methods
		.closeEvent()
		.accounts({
			organizer,
			eventState: pdas.eventState,
			escrowUsdc: pdas.escrowUsdc,
			organizerUsdcAccount,
			usdcMint: usdcMintPubkey,
		})
		.instruction();

	const { transaction, latestBlockhash } = await prepareTransaction(
		[closeIx],
		organizer,
	);
	return {
		transactionBase64: transaction
			.serialize({ requireAllSignatures: false })
			.toString("base64"),
		latestBlockhash,
	};
}

export { deriveEventPdas, type EventPdas };
