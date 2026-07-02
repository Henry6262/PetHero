import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import { Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { getNonce, verifySignature } from "../api";
import type { User } from "../../types";
import type { WalletAdapter, WalletProvider } from "./types";
import { DevKeyAdapter } from "./dev";
import { PhantomAdapter } from "./phantom";

interface WalletContextValue {
	publicKey: string | null;
	token: string | null;
	user: User | null;
	isConnecting: boolean;
	provider: WalletProvider | null;
	connect: (provider: WalletProvider, secretBase58?: string) => Promise<void>;
	login: () => Promise<void>;
	disconnect: () => void;
	signAndSendTransaction: (transactionBase64: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

function createAdapter(provider: WalletProvider, secretBase58?: string): WalletAdapter {
	switch (provider) {
		case "devkey":
			if (!secretBase58) throw new Error("Dev key adapter requires a secret key");
			return new DevKeyAdapter(secretBase58);
		case "phantom":
			return new PhantomAdapter();
		default:
			throw new Error(`Unsupported wallet provider: ${provider}`);
	}
}

export function WalletProvider({ children }: { children: ReactNode }) {
	const [adapter, setAdapter] = useState<WalletAdapter | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);

	const connect = useCallback(async (provider: WalletProvider, secretBase58?: string) => {
		const nextAdapter = createAdapter(provider, secretBase58);
		await nextAdapter.connect();
		setAdapter(nextAdapter);
	}, []);

	const login = useCallback(async () => {
		if (!adapter) throw new Error("Wallet not connected");
		setIsConnecting(true);
		try {
			const publicKey = adapter.publicKey!;
			const { message } = await getNonce(publicKey);
			const messageBytes = Buffer.from(message, "utf8");
			const signatureBytes = await adapter.signMessage(messageBytes);
			const signature = bs58.encode(signatureBytes);
			const auth = await verifySignature(publicKey, signature, message);
			setToken(auth.token);
			setUser(auth.user);
		} finally {
			setIsConnecting(false);
		}
	}, [adapter]);

	const disconnect = useCallback(async () => {
		await adapter?.disconnect();
		setAdapter(null);
		setToken(null);
		setUser(null);
	}, [adapter]);

	const signAndSendTransaction = useCallback(
		async (transactionBase64: string) => {
			if (!adapter) throw new Error("Wallet not connected");
			const txBuffer = Buffer.from(transactionBase64, "base64");
			const tx = Transaction.from(txBuffer);
			return adapter.signAndSendTransaction(tx);
		},
		[adapter],
	);

	const value: WalletContextValue = {
		publicKey: adapter?.publicKey ?? null,
		token,
		user,
		isConnecting,
		provider: adapter?.provider ?? null,
		connect,
		login,
		disconnect,
		signAndSendTransaction,
	};

	return (
		<WalletContext.Provider value={value}>{children}</WalletContext.Provider>
	);
}

export function useWallet() {
	const ctx = useContext(WalletContext);
	if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
	return ctx;
}
