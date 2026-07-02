import { Keypair, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { connection } from "../solana";
import type { WalletAdapter, WalletProvider } from "./types";

export class DevKeyAdapter implements WalletAdapter {
	provider: WalletProvider = "devkey";
	private keypair: Keypair | null = null;

	constructor(private secretBase58: string) {}

	get publicKey(): string | null {
		return this.keypair?.publicKey.toBase58() ?? null;
	}

	get isConnected(): boolean {
		return this.keypair !== null;
	}

	async connect(): Promise<void> {
		const secret = bs58.decode(this.secretBase58.trim());
		this.keypair = Keypair.fromSecretKey(secret);
	}

	async disconnect(): Promise<void> {
		this.keypair = null;
	}

	async signMessage(message: Uint8Array): Promise<Uint8Array> {
		if (!this.keypair) throw new Error("Wallet not connected");
		return (this.keypair as any).sign(message);
	}

	async signAndSendTransaction(transaction: Transaction): Promise<string> {
		if (!this.keypair) throw new Error("Wallet not connected");
		transaction.partialSign(this.keypair);
		const signature = await connection.sendRawTransaction(transaction.serialize(), {
			skipPreflight: false,
			preflightCommitment: "confirmed",
		});
		await connection.confirmTransaction(signature, "confirmed");
		return signature;
	}
}
