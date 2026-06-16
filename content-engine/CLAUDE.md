# CLAUDE.md - content-engine

> Read `~/Documents/Gazillion-dollars/AGENTS.md` first.

## What It Is

AI cinematic video factory for portfolio brands. The current practical path is:
concept files -> Kling video clips -> ElevenLabs voiceover -> ffmpeg assembly/captions -> finished vertical reel.

## Stack

- Bun + TypeScript
- Kling native API client in `src/lib/kling.ts`
- ElevenLabs TTS client in `src/lib/elevenlabs.ts`
- ffmpeg assembly in `src/lib/assemble.ts`
- Manifest state machine in `src/manifest.ts`

## Key Folders

```
brands/<brand>/
  brand.json
  concepts/<concept>/
    script.md
    shotlist.json
    prompts.json
    vo.txt
  assets/
    clips/
    vo/
    music/
    refs/
  output/
scripts/
  produce-krava-doesnt-fall.ts
```

## Environment

`content-engine/.env` holds the local API keys. Do not print secret values in logs.

Required for the Krava production runner:

- `KLING_ACCESS_KEY`
- `KLING_SECRET_KEY`
- `ELEVENLABS_API_KEY`
- local `ffmpeg` and `ffprobe`

## Brand Notes

Krava is a premium Bulgarian yogurt brand for Zurich, Switzerland.

Positioning:

- English: "Swiss Purity, Bulgarian Soul"
- German: "Schweizer Reinheit, bulgarische Seele"

Priority ad angle for Zurich conversion: a tight 15-second vertical ad built around the Spoon Test as visual proof of thickness, ending on an order/subscribe CTA.

## Last Updated

2026-06-09
