import type { Transaction } from "@solana/web3.js";

export type WalletProvider = "devkey" | "phantom" | "solflare" | "backpack";

export interface WalletAdapter {
	readonly provider: WalletProvider;
	readonly publicKey: string | null;
	readonly isConnected: boolean;

	connect(): Promise<void>;
	disconnect(): Promise<void>;
	signMessage(message: Uint8Array): Promise<Uint8Array>;
	signAndSendTransaction(transaction: Transaction): Promise<string>;
}

export interface PendingRequest<T = unknown> {
	id: string;
	resolve: (value: T) => void;
	reject: (reason?: Error) => void;
}
