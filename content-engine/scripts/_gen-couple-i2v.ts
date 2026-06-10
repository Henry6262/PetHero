import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { submitImage2Video, pollTask } from "../src/lib/kling";
const dir = "brands/krava/assets/clips/couple-ritual-en";
const anchorT = process.argv[2] ?? "2.5";
const anchor = `${dir}/_anchor.jpg`;
spawnSync("ffmpeg", ["-y","-loglevel","error","-ss",anchorT,"-i",`${dir}/s1.mp4`,"-frames:v","1","-q:v","3",anchor]);
const b64 = readFileSync(anchor).toString("base64");
console.log(`anchor @ ${anchorT}s, ${Math.round(b64.length/1024)}KB`);
const neg = "deformed face, asymmetric eyes, extra fingers, fused fingers, deformed hands, plastic skin, uncanny, distorted mouth, more than two people, duplicate face, watermark, text, blurry, low resolution";
const shots = [
  { id: 2, prompt: "The same couple stay together: the man playfully lifts a spoonful of thick white yogurt to the smiling woman and she takes the bite, both laughing warmly. Gentle natural motion, intimate morning light." },
  { id: 3, prompt: "The same couple lean their heads close together and both smile warmly toward the camera, content and healthy, the bowl of yogurt between them. Soft morning light, gentle motion." },
];
async function dl(url,out){for(let i=1;i<=4;i++){try{const r=await fetch(url);if(!r.ok)throw new Error(`http ${r.status}`);await Bun.write(out,await r.arrayBuffer());return;}catch(e){console.log(`dl try ${i}: ${e.message}`);await Bun.sleep(3000);}}throw new Error(`dl failed ${out}`);}
for (const s of shots) {
  console.log(`i2v shot ${s.id}...`);
  const id = await submitImage2Video({ image: b64, prompt: s.prompt, negativePrompt: neg, mode: "pro", duration: "5" });
  const url = await pollTask("image2video", id, { onTick:(st)=>console.log(`s${s.id}: ${st}`) });
  await dl(url, `${dir}/s${s.id}.mp4`);
  console.log(`DONE s${s.id}`);
}
console.log("ALL DONE couple i2v");
