import { tts } from '../src/lib/elevenlabs';

const NARRATION = "They said it was over. FTX took everything. " +
  "Then... one trencher lit a spark. And the trenches came back to life. " +
  "The architect. The bull. The seer. The prophet. ...And the beast. " +
  "But the one who rugged them all... is still out there. " +
  "So the trenches assembled. Earth's Mightiest Degens. ...Trench Royale.";

const out = 'brands/trench-royale/vo/narrator.mp3';
console.log('🎙️  generating narrator VO (Adam, dramatic trailer)...');
const bytes = await tts({
  text: NARRATION,
  stability: 0.4,      // expressive
  style: 0.45,         // dramatic
  speed: 0.92,         // slightly slow / epic
  similarityBoost: 0.9,
});
await Bun.write(out, bytes);
console.log(`✓ wrote ${out} (${(bytes.length/1024).toFixed(0)} KB)`);
