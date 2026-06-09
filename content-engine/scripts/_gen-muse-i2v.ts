// Drive shots 2 & 3 from a locked frame of shot 1 -> same woman across the scene.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { submitImage2Video, pollTask, downloadVideo } from "../src/lib/kling";

const dir = "brands/krava/assets/clips/breakfast-muse-en";
const anchorT = process.argv[2] ?? "4.2";            // seconds into s1 to grab her face
const anchor = `${dir}/_anchor.jpg`;
spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", anchorT, "-i", `${dir}/s1.mp4`, "-frames:v", "1", "-q:v", "3", anchor]);
const b64 = readFileSync(anchor).toString("base64");
console.log(`anchor @ ${anchorT}s, ${Math.round(b64.length/1024)}KB b64`);

const neg = "deformed face, asymmetric eyes, extra fingers, fused fingers, deformed hands, plastic skin, waxy skin, uncanny, distorted mouth, distorted teeth, multiple people, duplicate face, watermark, text, blurry, low resolution";
const shots = [
  { id: 2, prompt: "The same woman slowly closes her eyes, savoring the spoonful, a serene content smile spreading across her face. Subtle natural head motion, intimate soft morning light." },
  { id: 3, prompt: "The same woman lowers the spoon, smiles warmly and looks straight at the camera, relaxed and quietly inviting. Soft morning light, gentle natural motion." },
];
for (const s of shots) {
  console.log(`i2v shot ${s.id}...`);
  const id = await submitImage2Video({ image: b64, prompt: s.prompt, negativePrompt: neg, mode: "pro", duration: "5" });
  const url = await pollTask("image2video", id, { onTick: (st) => console.log(`s${s.id}: ${st}`) });
  await downloadVideo(url, `${dir}/s${s.id}.mp4`);
  console.log(`DONE s${s.id}`);
}
console.log("ALL DONE i2v");
