import * as Linking from "expo-linking";
import * as Crypto from "expo-crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { Transaction } from "@solana/web3.js";
import type { WalletAdapter, WalletProvider } from "./types";

// Seed TweetNaCl RNG with Expo Crypto so key generation works on React Native.
nacl.setPRNG((x, n) => {
	const bytes = Crypto.getRandomBytes(n);
	for (let i = 0; i < n; i++) x[i] = bytes[i];
});

const PHANTOM_BASE = "https://phantom.app/ul/v1";

interface PhantomSession {
	publicKey: string;
	session: string;
	sharedSecret: Uint8Array;
	dappPublicKey: Uint8Array;
	dappSecretKey: Uint8Array;
}

type PendingResolver = {
	resolve: (value: unknown) => void;
	reject: (reason?: Error) => void;
};

function buildRedirectLink(path: string): string {
	// Custom scheme must be registered in app.json so Phantom can redirect back.
	return `solanaeventpass://${path}`;
}

function encodeQuery(params: Record<string, string>): string {
	return Object.entries(params)
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join("&");
}

function parseQuery(url: string): Record<string, string> {
	const queryIndex = url.indexOf("?");
	if (queryIndex === -1) return {};
	const query = url.slice(queryIndex + 1);
	const result: Record<string, string> = {};
	for (const pair of query.split("&")) {
		const [k, v] = pair.split("=");
		if (k) result[decodeURIComponent(k)] = v ? decodeURIComponent(v) : "";
	}
	return result;
}

function parseDeepLinkPath(url: string): { scheme: string; host: string; pathParts: string[] } | null {
	// solanaeventpass://phantom/connect/<id>?foo=bar
	const match = url.match(/^([a-z][a-z0-9+.-]*):\/\/([^\/]+)(\/[^?]*)?(\?.*)?$/i);
	if (!match) return null;
	const scheme = match[1];
	const host = match[2];
	const path = match[3] ?? "";
	const pathParts = path.split("/").filter(Boolean);
	return { scheme, host, pathParts };
}

function encryptPayload(payload: object, sharedSecret: Uint8Array): { nonce: string; data: string } {
	const nonce = nacl.randomBytes(24);
	const message = Buffer.from(JSON.stringify(payload), "utf8");
	const encrypted = nacl.box.after(message, nonce, sharedSecret);
	return {
		nonce: bs58.encode(nonce),
		data: bs58.encode(encrypted),
	};
}

function decryptData(dataBase58: string, nonceBase58: string, sharedSecret: Uint8Array): unknown {
	const encrypted = bs58.decode(dataBase58);
	const nonce = bs58.decode(nonceBase58);
	const decrypted = nacl.box.open.after(encrypted, nonce, sharedSecret);
	if (!decrypted) throw new Error("Failed to decrypt Phantom response");
	return JSON.parse(Buffer.from(decrypted).toString("utf8"));
}

export class PhantomAdapter implements WalletAdapter {
	provider: WalletProvider = "phantom";
	private session: PhantomSession | null = null;
	private pending: Map<string, PendingResolver> = new Map();
	private linkingSubscription: { remove: () => void } | null = null;

	get publicKey(): string | null {
		return this.session?.publicKey ?? null;
	}

	get isConnected(): boolean {
		return this.session !== null;
	}

	async connect(): Promise<void> {
		this.startListening();
		const keypair = nacl.box.keyPair();
		const dappEncryptionPublicKey = bs58.encode(keypair.publicKey);
		const requestId = Crypto.randomUUID();

		const params = {
			app_url: "https://solanaeventpass.xyz",
			dapp_encryption_public_key: dappEncryptionPublicKey,
			redirect_link: buildRedirectLink(`phantom/connect/${requestId}`),
			cluster: "devnet",
		};

		const url = `${PHANTOM_BASE}/connect?${encodeQuery(params)}`;

		return new Promise((resolve, reject) => {
			this.pending.set(requestId, {
				resolve: (result) => {
					const response = result as {
						phantom_encryption_public_key: string;
						nonce: string;
						data: string;
					};
					const phantomPublicKey = bs58.decode(response.phantom_encryption_public_key);
					const sharedSecret = nacl.box.before(phantomPublicKey, keypair.secretKey);
					const data = decryptData(response.data, response.nonce, sharedSecret) as {
						public_key: string;
						session: string;
					};
					this.session = {
						publicKey: data.public_key,
						session: data.session,
						sharedSecret,
						dappPublicKey: keypair.publicKey,
						dappSecretKey: keypair.secretKey,
					};
					resolve();
				},
				reject,
			});
			Linking.openURL(url).catch(reject);
		});
	}

	async disconnect(): Promise<void> {
		this.session = null;
		this.pending.clear();
		this.stopListening();
	}

	async signMessage(message: Uint8Array): Promise<Uint8Array> {
		if (!this.session) throw new Error("Wallet not connected");
		const requestId = Crypto.randomUUID();
		const payload = {
			session: this.session.session,
			message: bs58.encode(message),
			redirect_link: buildRedirectLink(`phantom/signMessage/${requestId}`),
		};
		const { nonce, data } = encryptPayload(payload, this.session.sharedSecret);
		const params = {
			dapp_encryption_public_key: bs58.encode(this.session.dappPublicKey),
			nonce,
			data,
			redirect_link: payload.redirect_link,
		};
		const url = `${PHANTOM_BASE}/signMessage?${encodeQuery(params)}`;

		return new Promise((resolve, reject) => {
			this.pending.set(requestId, {
				resolve: (result) => {
					const response = result as { nonce: string; data: string };
					const decrypted = decryptData(response.data, response.nonce, this.session!.sharedSecret) as {
						signature: string;
					};
					resolve(bs58.decode(decrypted.signature));
				},
				reject,
			});
			Linking.openURL(url).catch(reject);
		});
	}

	async signAndSendTransaction(transaction: Transaction): Promise<string> {
		if (!this.session) throw new Error("Wallet not connected");
		const requestId = Crypto.randomUUID();
		const payload = {
			session: this.session.session,
			transaction: Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString("base64"),
			redirect_link: buildRedirectLink(`phantom/signAndSendTransaction/${requestId}`),
		};
		const { nonce, data } = encryptPayload(payload, this.session.sharedSecret);
		const params = {
			dapp_encryption_public_key: bs58.encode(this.session.dappPublicKey),
			nonce,
			data,
			redirect_link: payload.redirect_link,
		};
		const url = `${PHANTOM_BASE}/signAndSendTransaction?${encodeQuery(params)}`;

		return new Promise((resolve, reject) => {
			this.pending.set(requestId, {
				resolve: (result) => {
					const response = result as { nonce: string; data: string };
					const decrypted = decryptData(response.data, response.nonce, this.session!.sharedSecret) as {
						signature: string;
					};
					resolve(decrypted.signature);
				},
				reject,
			});
			Linking.openURL(url).catch(reject);
		});
	}

	private startListening(): void {
		if (this.linkingSubscription) return;
		this.linkingSubscription = Linking.addEventListener("url", (event: { url: string }) => {
			this.handleUrl(event.url);
		});
	}

	private stopListening(): void {
		this.linkingSubscription?.remove();
		this.linkingSubscription = null;
	}

	private handleUrl(url: string): void {
		const parsed = parseDeepLinkPath(url);
		if (!parsed || parsed.scheme !== "solanaeventpass" || parsed.host !== "phantom") return;
		if (parsed.pathParts.length < 2) return;
		const requestId = parsed.pathParts[1];
		const resolver = this.pending.get(requestId);
		if (!resolver) return;

		const params = parseQuery(url);
		const errorCode = params.errorCode;
		if (errorCode) {
			resolver.reject(new Error(params.errorMessage || `Phantom error: ${errorCode}`));
			this.pending.delete(requestId);
			return;
		}

		resolver.resolve(params);
		this.pending.delete(requestId);
	}
}
