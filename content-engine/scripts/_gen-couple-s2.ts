// One i2v shot from couple s1 anchor: the tender "new chapter" beat.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { submitImage2Video, pollTask } from "../src/lib/kling";
const dir = "brands/krava/assets/clips/couple-ritual-en";
spawnSync("ffmpeg", ["-y","-loglevel","error","-ss","2.5","-i",`${dir}/s1.mp4`,"-frames:v","1","-q:v","3",`${dir}/_anchor.jpg`]);
const b64 = readFileSync(`${dir}/_anchor.jpg`).toString("base64");
const neg = "deformed face, asymmetric eyes, extra fingers, fused fingers, deformed hands, plastic skin, uncanny, distorted mouth, more than two people, duplicate face, watermark, text, blurry, low resolution";
const prompt = "The same couple lower their spoons and lean closer together; she rests her head on his shoulder and they both smile softly, dreamy and hopeful, as if talking quietly about their future. Tender, warm morning light, gentle natural motion.";
const id = await submitImage2Video({ image: b64, prompt, negativePrompt: neg, mode: "pro", duration: "5" });
const url = await pollTask("image2video", id, { onTick:(s)=>console.log("s2:",s) });
for (let i=1;i<=4;i++){ try{ const r=await fetch(url); if(!r.ok) throw new Error(`http ${r.status}`); await Bun.write(`${dir}/s2.mp4`, await r.arrayBuffer()); console.log("DONE s2"); process.exit(0);}catch(e){console.log(`dl try ${i}: ${e.message}`); await Bun.sleep(3000);} }
process.exit(1);
