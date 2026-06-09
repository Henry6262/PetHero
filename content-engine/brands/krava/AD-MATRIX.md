# Krava — V2 Ad Test Matrix

10 finished 15s vertical (1080×1920) creatives in `output/`. Goal: test **5 distinct
ad types × EN + DE** to see which angle/hook earns the cheapest clicks. Footage is
remixed across only **2 Kling renders** (`doesnt-fall`, `farm-to-fridge-en`) — the
editing team can re-cut, restyle, and add real product/jar shots on top.

| Ad type (test angle) | EN file | DE file | Footage remix | Platform lean |
|---|---|---|---|---|
| Texture-Proof (spoon) | `spoon-test-en.mp4` | `loeffel-test-de.mp4` | doesnt-fall s1→s2→s3 | Meta Reels |
| Morning Ritual | `morning-ritual-en.mp4` | `morning-ritual-de.mp4` | doesnt-fall s3→s2 + farm s3 | TikTok / Reels |
| Fresh Delivery + Offer | `farm-to-fridge-en.mp4` | `fresh-delivery-de.mp4` | farm s1→s2→s3 | IG/FB Stories |
| Living Cultures | `living-cultures-en.mp4` | `living-cultures-de.mp4` | doesnt-fall s2 + farm s3 + doesnt-fall s1 | TikTok / Reels |
| Heritage | `heritage-en.mp4` | `heritage-de.mp4` | farm s2 + doesnt-fall s2→s3 | Reels / YT Shorts |

Each concept lives in `concepts/<slug>/` (`ad.json` = clip remix + voice + timed
captions, `vo.txt` = narration). Rebuild any one with:

```bash
bun run scripts/produce-krava-ad.ts <slug>
```

Delete `output/<slug>.mp4` (or `assets/vo/<slug>.mp3`) first to force a re-render of
that stage; everything else is cached/reused.

## Footage inventory (reusable building blocks)

- `doesnt-fall/s1` — spoon stands upright in thick yogurt (texture proof)
- `doesnt-fall/s2` — yogurt folds + honey drizzle + berries, slow-mo (sensory)
- `doesnt-fall/s3` — Zürich breakfast hero, hand lifts a spoonful (lifestyle)
- `farm-to-fridge-en/s1` — POV jar lifted from doorstep delivery bag (convenience)
- `farm-to-fridge-en/s2` — Swiss alpine cows + mountains → dairy vat (origin)
- `farm-to-fridge-en/s3` — overhead flat-lay bowl, raspberries + honey (food styling)

## Compliance flags (resolve before spending media budget)

These claims were deliberately **kept out** of VO/captions pending real product +
legal sign-off (Swiss UCA / OPD / food-claim rules):

- **No medical/digestion/immunity claims.** "Living cultures" is used as a factual
  product descriptor only — never "probiotic benefit", "gut health", "digestion support".
- **No specific culture count** ("14 live cultures" etc.) until lab-substantiated.
- **No "raw / unpasteurised / zero sugar / high-protein"** until the spec confirms it
  (high-protein is a regulated nutrition claim; needs the threshold met).
- **The "−20% first order" badge** the research pushes is NOT burned into these cuts.
  Under the 2025 OPD the base price must have run 30 consecutive days first. The DE
  delivery cut says "Erste Lieferung sichern" (no %); add a % badge in edit only once
  the 30-day rule is satisfied.
- **"Farm to fridge in 48h / Mon→Wed"** is a logistics claim — keep only if the real
  delivery schedule supports it.
- **Jar/label:** AI footage shows unbranded vessels on purpose. Composite the real
  Krava jar + "Swiss Purity, Bulgarian Soul" lockup in post for brand consistency.
