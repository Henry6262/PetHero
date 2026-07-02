import { PublicKey } from "@solana/web3.js";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { config } from "../config.js";
import {
	connection,
	confirmTransaction,
	getExplorerUrl,
} from "../lib/solana.js";
import {
	eventTokens,
	eventVendors,
	terminals,
	transactions,
} from "@solana-event-pass/db";
import { deductBalance } from "./wallet.js";
import { buildPayVendorTx } from "./tokens.js";

export interface PaymentRequest {
	eventId: string;
	amount: string;
	terminalId: string;
}

export async function createPaymentRequest(input: PaymentRequest) {
	const terminal = await db.query.terminals.findFirst({
		where: eq(terminals.id, input.terminalId),
	});

	if (!terminal) {
		throw new Error("Terminal not found");
	}

	const token = await db.query.eventTokens.findFirst({
		where: eq(eventTokens.eventId, input.eventId),
	});

	if (!token) {
		throw new Error("Event token not found");
	}

	const recipient = new PublicKey(terminal.walletAddress);
	const reference = new PublicKey(
		new Uint8Array(32).map(() => Math.floor(Math.random() * 256)),
	);
	const url = new URL(`solana:${recipient.toBase58()}`);
	url.searchParams.set("amount", input.amount);
	url.searchParams.set("reference", reference.toBase58());
	url.searchParams.set("label", terminal.name);
	url.searchParams.set("message", `Payment for ${token.name}`);

	return {
		solanaPayUrl: url.toString(),
		terminalId: terminal.id,
		eventTokenId: token.id,
		amount: input.amount,
		recipient: recipient.toBase58(),
	};
}

export interface PaymentTransactionInput {
	senderUserId: string;
	terminalId: string;
	amount: string;
	attendeePublicKey: string;
}

export async function buildPaymentTransaction(input: PaymentTransactionInput) {
	const terminal = await db.query.terminals.findFirst({
		where: eq(terminals.id, input.terminalId),
	});
	if (!terminal) {
		throw new Error("Terminal not found");
	}

	const eventVendor = await db.query.eventVendors.findFirst({
		where: eq(eventVendors.id, terminal.eventVendorId),
	});
	if (!eventVendor) {
		throw new Error("Event vendor not found");
	}

	const token = await db.query.eventTokens.findFirst({
		where: eq(eventTokens.eventId, eventVendor.eventId),
	});
	if (!token) {
		throw new Error("Event token not found");
	}

	const amountTokens = parseFloat(input.amount);
	if (Number.isNaN(amountTokens) || amountTokens <= 0) {
		throw new Error("Amount must be positive");
	}
	const amountBaseUnits = Math.round(
		amountTokens * 10 ** token.decimals,
	).toString();

	const tx = await buildPayVendorTx(
		token.eventId,
		input.attendeePublicKey,
		terminal.walletAddress,
		amountBaseUnits,
		config.USDC_MINT,
	);

	return {
		transactionBase64: tx.transactionBase64,
		latestBlockhash: tx.latestBlockhash,
		terminalId: terminal.id,
		eventTokenId: token.id,
		amount: input.amount,
		recipient: terminal.walletAddress,
	};
}

export interface VerifyPaymentInput {
	signature: string;
	senderUserId: string;
	terminalId: string;
	eventTokenId: string;
	amount: string;
}

export async function verifyPayment(input: VerifyPaymentInput) {
	const confirmed = await confirmTransaction(input.signature);

	if (!confirmed) {
		throw new Error("Transaction not confirmed");
	}

	const tx = await connection.getTransaction(input.signature, {
		commitment: "confirmed",
		maxSupportedTransactionVersion: 0,
	});

	if (!tx) {
		throw new Error("Transaction not found");
	}

	// Deduct user's token balance
	const deducted = await deductBalance(
		input.senderUserId,
		input.eventTokenId,
		input.amount,
	);
	if (!deducted) {
		throw new Error("Insufficient token balance");
	}

	const [record] = await db
		.insert(transactions)
		.values({
			senderUserId: input.senderUserId,
			terminalId: input.terminalId,
			eventTokenId: input.eventTokenId,
			amount: input.amount,
			signature: input.signature,
			status: "confirmed",
			metadata: {
				explorerUrl: getExplorerUrl(input.signature),
				slot: tx.slot,
			},
			confirmedAt: new Date(),
		})
		.returning();

	return {
		status: "confirmed",
		signature: input.signature,
		explorerUrl: getExplorerUrl(input.signature),
		record,
	};
}
