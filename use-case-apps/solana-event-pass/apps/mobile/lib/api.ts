import Constants from "expo-constants";
import type {
	AuthResponse,
	Event,
	EventWallet,
	HistoryItem,
	Order,
	TxPayload,
} from "../types";

const baseUrl =
	(Constants.expoConfig?.extra?.apiBaseUrl as string) ||
	"http://localhost:3002";

function getHeaders(token?: string | null) {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.error || `Request failed: ${res.status}`);
	}
	return res.json() as Promise<T>;
}

export async function getNonce(publicKey: string) {
	const res = await fetch(`${baseUrl}/auth/nonce`, {
		method: "POST",
		headers: getHeaders(),
		body: JSON.stringify({ publicKey }),
	});
	return handleResponse<{ nonce: string; message: string }>(res);
}

export async function verifySignature(
	publicKey: string,
	signature: string,
	nonce: string,
) {
	const res = await fetch(`${baseUrl}/auth/verify`, {
		method: "POST",
		headers: getHeaders(),
		body: JSON.stringify({ publicKey, signature, nonce }),
	});
	return handleResponse<AuthResponse>(res);
}

export async function getEvents(token: string) {
	const res = await fetch(`${baseUrl}/events`, {
		headers: getHeaders(token),
	});
	return handleResponse<{ events: Event[] }>(res);
}

export async function getEvent(token: string, eventId: string) {
	const res = await fetch(`${baseUrl}/events/${eventId}`, {
		headers: getHeaders(token),
	});
	return handleResponse<{ event: Event }>(res);
}

export async function getWallet(token: string, eventId: string) {
	const res = await fetch(`${baseUrl}/wallet/${eventId}`, {
		headers: getHeaders(token),
	});
	return handleResponse<{ wallet: EventWallet }>(res);
}

export async function getWalletHistory(token: string, eventId: string) {
	const res = await fetch(`${baseUrl}/wallet/${eventId}/history`, {
		headers: getHeaders(token),
	});
	return handleResponse<{ history: HistoryItem[] }>(res);
}

export async function createTopUpOrder(
	token: string,
	eventId: string,
	amountTokens: string,
	paymentMethod: "usdc" | "fiat" = "usdc",
) {
	const res = await fetch(`${baseUrl}/wallet/${eventId}/topup`, {
		method: "POST",
		headers: getHeaders(token),
		body: JSON.stringify({ amountTokens, paymentMethod }),
	});
	return handleResponse<{ order: Order; token: EventWallet }>(res);
}

export async function getTopUpTransaction(
	token: string,
	orderId: string,
	walletAddress: string,
) {
	const res = await fetch(
		`${baseUrl}/wallet/orders/${orderId}/topup-transaction`,
		{
			method: "POST",
			headers: getHeaders(token),
			body: JSON.stringify({ walletAddress }),
		},
	);
	return handleResponse<TxPayload>(res);
}

export async function verifyTopUpOnChain(
	token: string,
	orderId: string,
	signature: string,
) {
	const res = await fetch(
		`${baseUrl}/wallet/orders/${orderId}/verify-onchain`,
		{
			method: "POST",
			headers: getHeaders(token),
			body: JSON.stringify({ signature }),
		},
	);
	return handleResponse<{
		order: Order;
		wallet: EventWallet;
		signature: string;
	}>(res);
}

export async function buildPaymentTransaction(
	token: string,
	terminalId: string,
	amount: string,
	attendeePublicKey: string,
) {
	const res = await fetch(`${baseUrl}/payments/transaction`, {
		method: "POST",
		headers: getHeaders(token),
		body: JSON.stringify({ terminalId, amount, attendeePublicKey }),
	});
	return handleResponse<
		TxPayload & {
			terminalId: string;
			eventTokenId: string;
			amount: string;
			recipient: string;
		}
	>(res);
}

export async function verifyPayment(
	token: string,
	signature: string,
	terminalId: string,
	eventTokenId: string,
	amount: string,
) {
	const res = await fetch(`${baseUrl}/payments/verify`, {
		method: "POST",
		headers: getHeaders(token),
		body: JSON.stringify({ signature, terminalId, eventTokenId, amount }),
	});
	return handleResponse<{
		status: string;
		signature: string;
		explorerUrl: string;
	}>(res);
}
