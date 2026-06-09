import { readFileSync } from "node:fs";
import { submitImage2Video, pollTask } from "../src/lib/kling";
const dir = "brands/krava/assets/clips/breakfast-muse-en";
const b64 = readFileSync(`${dir}/_anchor.jpg`).toString("base64");
const neg = "deformed face, asymmetric eyes, extra fingers, fused fingers, deformed hands, plastic skin, waxy skin, uncanny, distorted mouth, distorted teeth, multiple people, duplicate face, watermark, text, blurry, low resolution";
const prompt = "The same woman lowers the spoon, smiles warmly and looks straight at the camera, relaxed and quietly inviting. Soft morning light, gentle natural motion.";
const id = await submitImage2Video({ image: b64, prompt, negativePrompt: neg, mode: "pro", duration: "5" });
const url = await pollTask("image2video", id, { onTick: (st) => console.log(`s3: ${st}`) });
console.log("URL ready, downloading with retries...");
for (let i = 1; i <= 4; i++) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`http ${res.status}`);
    await Bun.write(`${dir}/s3.mp4`, await res.arrayBuffer());
    console.log("DONE s3"); process.exit(0);
  } catch (e) { console.log(`download try ${i} failed: ${e.message}`); await Bun.sleep(3000); }
}
console.log("download FAILED after retries"); process.exit(1);
