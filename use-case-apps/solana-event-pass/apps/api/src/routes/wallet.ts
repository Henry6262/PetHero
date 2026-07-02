import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import {
	getWalletForEvent,
	getWalletHistory,
	createTopUpOrder,
	completeTopUpOrder,
	getTopUpTransaction,
	completeTopUpOnChain,
} from "../services/wallet.js";
import type { UserVariables } from "../types/hono.js";

const app = new Hono<{ Variables: UserVariables }>();

app.use("*", authMiddleware);

const eventIdParam = z.object({ eventId: z.string().uuid() });
const orderIdParam = z.object({ orderId: z.string().uuid() });

const topUpSchema = z.object({
	amountTokens: z
		.string()
		.refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
			message: "Amount must be a positive number",
		}),
	paymentMethod: z.enum(["usdc", "fiat"]),
});

const walletAddressSchema = z.object({
	walletAddress: z.string().min(32),
});

const verifyOnChainSchema = z.object({
	signature: z.string().min(32),
});

app.get("/:eventId", zValidator("param", eventIdParam), async (c) => {
	const user = c.get("user");
	const { eventId } = c.req.valid("param");

	try {
		const wallet = await getWalletForEvent(user.id, eventId);
		return c.json({ wallet });
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to load wallet";
		return c.json({ error: message }, 400);
	}
});

app.get("/:eventId/history", zValidator("param", eventIdParam), async (c) => {
	const user = c.get("user");
	const { eventId } = c.req.valid("param");

	try {
		const history = await getWalletHistory(user.id, eventId);
		return c.json(history);
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to load history";
		return c.json({ error: message }, 400);
	}
});

app.post(
	"/:eventId/topup",
	zValidator("param", eventIdParam),
	zValidator("json", topUpSchema),
	async (c) => {
		const user = c.get("user");
		const { eventId } = c.req.valid("param");
		const body = c.req.valid("json");

		try {
			const result = await createTopUpOrder({
				userId: user.id,
				eventId,
				amountTokens: body.amountTokens,
				paymentMethod: body.paymentMethod,
			});
			return c.json(result, 201);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to create top-up";
			return c.json({ error: message }, 400);
		}
	},
);

app.post(
	"/orders/:orderId/complete",
	zValidator("param", orderIdParam),
	async (c) => {
		const user = c.get("user");
		const { orderId } = c.req.valid("param");

		try {
			const result = await completeTopUpOrder(orderId, user.id);
			return c.json(result);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to complete top-up";
			return c.json({ error: message }, 400);
		}
	},
);

app.post(
	"/orders/:orderId/topup-transaction",
	zValidator("param", orderIdParam),
	zValidator("json", walletAddressSchema),
	async (c) => {
		const user = c.get("user");
		const { orderId } = c.req.valid("param");
		const { walletAddress } = c.req.valid("json");

		try {
			const result = await getTopUpTransaction(orderId, user.id, walletAddress);
			return c.json(result);
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to build top-up transaction";
			return c.json({ error: message }, 400);
		}
	},
);

app.post(
	"/orders/:orderId/verify-onchain",
	zValidator("param", orderIdParam),
	zValidator("json", verifyOnChainSchema),
	async (c) => {
		const user = c.get("user");
		const { orderId } = c.req.valid("param");
		const { signature } = c.req.valid("json");

		try {
			const result = await completeTopUpOnChain(orderId, user.id, signature);
			return c.json(result);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to verify on-chain top-up";
			return c.json({ error: message }, 400);
		}
	},
);

export default app;
