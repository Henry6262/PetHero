import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db.js";
import { config } from "../config.js";
import {
	eventTokens,
	orders,
	tokenBalances,
	transactions,
} from "@solana-event-pass/db";
import { buildTopUpTx } from "./tokens.js";
import {
	confirmTransaction,
	connection,
	getExplorerUrl,
} from "../lib/solana.js";

export interface TopUpInput {
	userId: string;
	eventId: string;
	amountTokens: string;
	paymentMethod: "usdc" | "fiat";
}

export async function getWalletForEvent(userId: string, eventId: string) {
	const token = await db.query.eventTokens.findFirst({
		where: eq(eventTokens.eventId, eventId),
	});

	if (!token) {
		throw new Error("Event token not found");
	}

	const balance = await db.query.tokenBalances.findFirst({
		where: and(
			eq(tokenBalances.userId, userId),
			eq(tokenBalances.eventTokenId, token.id),
		),
	});

	return {
		eventTokenId: token.id,
		tokenName: token.name,
		tokenSymbol: token.symbol,
		decimals: token.decimals,
		mintAddress: token.mintAddress,
		balance: balance?.balance ?? "0",
	};
}

export async function getWalletHistory(userId: string, eventId: string) {
	const token = await db.query.eventTokens.findFirst({
		where: eq(eventTokens.eventId, eventId),
	});

	if (!token) {
		throw new Error("Event token not found");
	}

	const [orderHistory, transactionHistory] = await Promise.all([
		db.query.orders.findMany({
			where: and(eq(orders.userId, userId), eq(orders.eventTokenId, token.id)),
			orderBy: desc(orders.createdAt),
		}),
		db.query.transactions.findMany({
			where: and(
				eq(transactions.senderUserId, userId),
				eq(transactions.eventTokenId, token.id),
			),
			orderBy: desc(transactions.createdAt),
		}),
	]);

	const historyItems = [
		...orderHistory.map((o) => ({
			id: o.id,
			type: "topup" as const,
			amount: o.amountTokens,
			status: o.status,
			paymentMethod: o.paymentMethod,
			createdAt: o.createdAt,
		})),
		...transactionHistory.map((t) => ({
			id: t.id,
			type: "payment" as const,
			amount: t.amount,
			status: t.status,
			terminalId: t.terminalId,
			signature: t.signature,
			createdAt: t.createdAt,
		})),
	];

	historyItems.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);

	return { history: historyItems };
}

export async function createTopUpOrder(input: TopUpInput) {
	const token = await db.query.eventTokens.findFirst({
		where: eq(eventTokens.eventId, input.eventId),
	});

	if (!token) {
		throw new Error("Event token not found");
	}

	const amountTokens = parseFloat(input.amountTokens);
	if (isNaN(amountTokens) || amountTokens <= 0) {
		throw new Error("Amount must be positive");
	}

	// 1 token = 1 USDC in MVP
	const amountUsd = amountTokens.toFixed(6);

	const [order] = await db
		.insert(orders)
		.values({
			userId: input.userId,
			eventTokenId: token.id,
			type: "topup",
			amountTokens: input.amountTokens,
			amountUsd,
			paymentMethod: input.paymentMethod,
			status: "pending",
		})
		.returning();

	return { order, token };
}

export async function completeTopUpOrder(orderId: string, userId: string) {
	const order = await db.query.orders.findFirst({
		where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
	});

	if (!order) {
		throw new Error("Order not found");
	}

	if (order.status !== "pending") {
		throw new Error("Order is not pending");
	}

	if (order.type !== "topup") {
		throw new Error("Order is not a top-up");
	}

	// Upsert token balance
	const existing = await db.query.tokenBalances.findFirst({
		where: and(
			eq(tokenBalances.userId, userId),
			eq(tokenBalances.eventTokenId, order.eventTokenId),
		),
	});

	if (existing) {
		await db
			.update(tokenBalances)
			.set({
				balance: sql`${tokenBalances.balance} + ${order.amountTokens}`,
				updatedAt: new Date(),
			})
			.where(eq(tokenBalances.id, existing.id));
	} else {
		await db.insert(tokenBalances).values({
			userId,
			eventTokenId: order.eventTokenId,
			balance: order.amountTokens,
		});
	}

	// Mark order completed
	const [updatedOrder] = await db
		.update(orders)
		.set({ status: "completed", updatedAt: new Date() })
		.where(eq(orders.id, orderId))
		.returning();

	// Get the eventId from the token to return the wallet view
	const token = await db.query.eventTokens.findFirst({
		where: eq(eventTokens.id, order.eventTokenId),
	});

	if (!token) {
		throw new Error("Event token not found");
	}

	const wallet = await getWalletForEvent(userId, token.eventId);

	return {
		order: updatedOrder,
		wallet,
	};
}

function toBaseUnits(amountTokens: string, decimals: number): string {
	const value = parseFloat(amountTokens);
	if (Number.isNaN(value) || value < 0) throw new Error("Invalid token amount");
	return Math.round(value * 10 ** decimals).toString();
}

export async function getTopUpTransaction(
	orderId: string,
	userId: string,
	walletAddress: string,
) {
	const order = await db.query.orders.findFirst({
		where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
	});
	if (!order) throw new Error("Order not found");
	if (order.status !== "pending") throw new Error("Order is not pending");

	const token = await db.query.eventTokens.findFirst({
		where: eq(eventTokens.id, order.eventTokenId),
	});
	if (!token) throw new Error("Event token not found");

	const amountBaseUnits = toBaseUnits(order.amountTokens, token.decimals);

	const tx = await buildTopUpTx(
		token.eventId,
		walletAddress,
		amountBaseUnits,
		config.USDC_MINT,
	);

	return {
		orderId,
		transactionBase64: tx.transactionBase64,
		latestBlockhash: tx.latestBlockhash,
	};
}

export async function completeTopUpOnChain(
	orderId: string,
	userId: string,
	signature: string,
) {
	const confirmed = await confirmTransaction(signature);
	if (!confirmed) throw new Error("Transaction not confirmed");

	const result = await completeTopUpOrder(orderId, userId);

	await db
		.update(orders)
		.set({
			externalReference: signature,
			updatedAt: new Date(),
		})
		.where(eq(orders.id, orderId));

	return {
		...result,
		signature,
		explorerUrl: getExplorerUrl(signature),
	};
}

export async function deductBalance(
	userId: string,
	eventTokenId: string,
	amount: string,
): Promise<boolean> {
	const balance = await db.query.tokenBalances.findFirst({
		where: and(
			eq(tokenBalances.userId, userId),
			eq(tokenBalances.eventTokenId, eventTokenId),
		),
	});

	if (!balance) return false;

	const current = parseFloat(balance.balance);
	const deduct = parseFloat(amount);

	if (current < deduct) return false;

	await db
		.update(tokenBalances)
		.set({
			balance: sql`${tokenBalances.balance} - ${amount}`,
			updatedAt: new Date(),
		})
		.where(eq(tokenBalances.id, balance.id));

	return true;
}
