import { Connection } from "@solana/web3.js";
import Constants from "expo-constants";

const rpcUrl =
	(Constants.expoConfig?.extra?.solanaRpcUrl as string) ||
	"https://api.devnet.solana.com";

export const connection = new Connection(rpcUrl, "confirmed");
