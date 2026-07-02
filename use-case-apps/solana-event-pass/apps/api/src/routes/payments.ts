import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import {
	createPaymentRequest,
	verifyPayment,
	buildPaymentTransaction,
} from "../services/payments.js";
import type { UserVariables } from "../types/hono.js";

const app = new Hono<{ Variables: UserVariables }>();

app.use("*", authMiddleware);

const requestSchema = z.object({
	eventId: z.string().uuid(),
	amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
		message: "Amount must be a positive number",
	}),
	terminalId: z.string().uuid(),
});

const verifySchema = z.object({
	signature: z.string().min(32),
	terminalId: z.string().uuid(),
	eventTokenId: z.string().uuid(),
	amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
		message: "Amount must be a positive number",
	}),
});

const transactionSchema = z.object({
	terminalId: z.string().uuid(),
	amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
		message: "Amount must be a positive number",
	}),
	attendeePublicKey: z.string().min(32),
});

app.post("/request", zValidator("json", requestSchema), async (c) => {
	try {
		const request = await createPaymentRequest(c.req.valid("json"));
		return c.json(request);
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to create payment request";
		return c.json({ error: message }, 400);
	}
});

app.post("/verify", zValidator("json", verifySchema), async (c) => {
	try {
		const body = c.req.valid("json");
		const user = c.get("user");
		const result = await verifyPayment({
			signature: body.signature,
			senderUserId: user.id,
			terminalId: body.terminalId,
			eventTokenId: body.eventTokenId,
			amount: body.amount,
		});
		return c.json(result);
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to verify payment";
		return c.json({ error: message }, 400);
	}
});

app.post("/transaction", zValidator("json", transactionSchema), async (c) => {
	try {
		const body = c.req.valid("json");
		const user = c.get("user");
		const result = await buildPaymentTransaction({
			senderUserId: user.id,
			terminalId: body.terminalId,
			amount: body.amount,
			attendeePublicKey: body.attendeePublicKey,
		});
		return c.json(result);
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: "Failed to build payment transaction";
		return c.json({ error: message }, 400);
	}
});

export default app;
