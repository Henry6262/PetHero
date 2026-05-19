import { DmarketClient } from "./src/ingestion/dmarket.client.ts";
import nacl from "tweetnacl";

async function test() {
  const publicKey = process.env["DMARKET_PUBLIC_KEY"] ?? "";
  const privateKeyStr = process.env["DMARKET_PRIVATE_KEY"] ?? "";

  if (!publicKey || !privateKeyStr) {
    console.error("Missing DMarket keys in .env");
    return;
  }

  console.log("🔍 Searching for correct 32-byte seed in private key string...");
  let correctSeed: Uint8Array | null = null;

  for (let i = 0; i <= privateKeyStr.length - 64; i++) {
    try {
      const chunk = privateKeyStr.substring(i, i + 64);
      const seed = new Uint8Array(Buffer.from(chunk, "hex"));
      const keyPair = nacl.sign.keyPair.fromSeed(seed);
      const derivedPubKey = Buffer.from(keyPair.publicKey).toString("hex");
      
      if (derivedPubKey === publicKey) {
        console.log(`✅ FOUND SEED at offset ${i}: ${chunk}`);
        correctSeed = seed;
        break;
      }
    } catch (e) {}
  }

  if (!correctSeed) {
    console.error("❌ Could not find a 32-byte seed that generates the provided public key.");
    return;
  }

  const client = new DmarketClient({ 
    publicKey, 
    privateKey: Buffer.from(nacl.sign.keyPair.fromSeed(correctSeed).secretKey).toString("hex") 
  });

  console.log("🔍 Testing DMarket Integration with found seed...");
  
  try {
    const balance = await client.getBalance();
    console.log(`✅ Balance: $${(balance.usdCents / 100).toFixed(2)}`);

    console.log("📦 Fetching market items (discovery)...");
    const { items } = await client.getMarketItems(10);
    console.log(`✅ Fetched ${items.length} aggregated item titles.`);
    if (items.length > 0) {
      console.log("Sample item:", items[0]?.market_hash_name, `@ $${items[0]?.min_price}`);
    }
    
  } catch (err) {
    console.error("❌ Test failed:", err);
  }
}

test();
