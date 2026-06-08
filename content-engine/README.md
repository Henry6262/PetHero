# Content Engine

Claude-Code-orchestrated AI cinematic video factory. Phase 0: manifest-tracked ffmpeg
assembly + captioning pipeline, plus Sauce Empire "Ancient Fire Legends" concepts.

See the design spec: `../docs/superpowers/specs/2026-06-08-ai-content-engine-design.md`

## Setup
```bash
brew install ffmpeg
bun install
bun test          # unit + ffmpeg integration (synthetic clips)
```

## Prove the chain (no API, no assets)
```bash
bun run src/pipeline/smoke.ts   # writes brands/sauce-empire/output/smoke.mp4
```

## $0 hybrid workflow (now)
1. Generate the 4 shot clips for a concept on Kling's free GUI tier
   (prompts in `brands/sauce-empire/concepts/<concept>/prompts.json`),
   drop them in `brands/<brand>/assets/clips/`.
2. Record/generate the voiceover from `vo.txt` (free ElevenLabs tier for testing),
   drop in `assets/vo/`.
3. Assemble:
   ```ts
   import { runVideo } from "./src/pipeline/run";
   await runVideo({
     manifestPath: "manifest.json",
     brand: "sauce-empire",
     concept: "mayan-ember",
     clips: ["brands/sauce-empire/assets/clips/s1.mp4", "..."],
     voPath: "brands/sauce-empire/assets/vo/mayan.m4a",
     outPath: "brands/sauce-empire/output/mayan-ember.mp4",
     caption: true,   // needs OPENAI_API_KEY (already in repo env)
   });
   ```

## Roadmap (later phases — see spec)
- Phase 1: fal.ai (Veo/Kling) + paid ElevenLabs auto-generation.
- Phase 2: Late/getlate.dev posting API + approval gate.
- Phase 3: cron factory + analytics loop; add brands (Krava, Bookit).
