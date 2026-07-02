export interface Event {
	id: string;
	name: string;
	description?: string;
	startAt: string;
	endAt: string;
	location?: string;
	coverImage?: string;
	tokenBalance?: string;
	tokenSymbol?: string;
}

export interface EventWallet {
	eventTokenId: string;
	tokenName: string;
	tokenSymbol: string;
	decimals: number;
	mintAddress: string;
	balance: string;
}

export interface HistoryItem {
	id: string;
	type: "topup" | "payment";
	amount: string;
	status: string;
	createdAt: string;
	paymentMethod?: string;
	terminalId?: string;
	signature?: string;
}

export interface Order {
	id: string;
	status: string;
	amountTokens: string;
	amountUsd: string;
	paymentMethod: string;
	createdAt: string;
}

export interface User {
	id: string;
	publicKey: string;
}

export interface AuthResponse {
	token: string;
	user: User;
}

export interface TxPayload {
	transactionBase64: string;
	latestBlockhash: {
		blockhash: string;
		lastValidBlockHeight: number;
	};
}
