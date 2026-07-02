import { z } from "zod";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

// Load .env from project root (wherever the API is started from)
const envPath = resolve(process.cwd(), "../../.env");
dotenvConfig({ path: envPath });

const configSchema = z.object({
	PORT: z.string().default("3000").transform(Number),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	DATABASE_URL: z
		.string()
		.default("postgres://postgres:postgres@localhost:5432/solana_event_pass"),
	REDIS_URL: z.string().default("redis://localhost:6379"),
	JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
	SOLANA_RPC_URL: z.string().default("https://api.devnet.solana.com"),
	SOLANA_NETWORK: z
		.enum(["mainnet-beta", "devnet", "testnet"])
		.default("devnet"),
	EVENT_PASS_PROGRAM_ID: z
		.string()
		.default("EMJX3vXDX9uRyBoHj91LERVg7bRiwjsc6vprzoZDypjf"),
	SOLANA_BACKEND_KEYPAIR_BASE58: z.string().optional(),
	USDC_MINT: z.string().default("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
	LUMA_API_KEY: z.string().optional(),
	LUMA_CALENDAR_ID: z.string().optional(),
	HELIUS_API_KEY: z.string().optional(),
});

export const config = configSchema.parse(process.env);
