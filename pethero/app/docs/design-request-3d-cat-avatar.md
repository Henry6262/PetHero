# Design Request: 3D Cat Avatar & Gamified Stats

> For: design/agent teammate  
> Project: PetHero (React Native / Expo app)  
> Branch: `feat/trench-royale-launch-polish`  
> Date: 2026-06-20  
> Reference mockups: `BrainMax Hub.html`

---

## 1. Direction from Henry

- Generate a **3D animated avatar from a single pet photo** using Meshy AI.
- The avatar must be **rigged and animated** (idle, walk, sit, stretch, groom).
- The new feature **replaces the current Pets section** on the home screen.
- The existing pet selector becomes a **compact navigation bar** for switching the active cat.
- Add **game-like stats** so taking care of the pet feels like progression.
- Core brand hook: **“Looksmax your cat.”**
- Focus on the **base UI first**. Games and mobile integration come later.
- Marketing ideas (ads, Instagram, Kling AI content) are captured for later but out of scope for v1.

---

## 2. What PetHero is

PetHero is a smart pet feeder mobile app evolving into a **pet care RPG**. The home screen currently shows:

- A live camera view of the feeding bowl.
- One-tap dispense actions: **Feed**, **Water**, **Medicine**.
- A pet selector (ring tray of cats/dogs).
- An agent panel that explains why a dispense was allowed or blocked.

Backend is FastAPI. The app talks to it over REST + WebSocket.

---

## 3. What the mockups show

The `BrainMax Hub.html` prototype gives us the base UI to adapt.

### Palette & materials

- Background: `#F4F1EA` (warm off-white)
- Primary dark: `#1B1A17`
- Card border: `#ECE7DE`
- Muted text: `#9A968D` / `#98938A`
- Accent green/red: `#8FCBA8` / `#E5372B`
- Font: `Hanken Grotesk` for headings, `Space Mono` for numbers/ratings
- Icons: Material Symbols (`ms` class)
- Cards: white with `1.5px solid #ECE7DE` border and `14–20px` radius
- Dark hero cards: `#1B1A17` with off-white text

### Navigation

A slick bottom nav with a floating active blob:

- Dark pill bar (`#1B1A17`, `34px` radius, `62px` height).
- Three tabs: Home, Train, Pets.
- Active tab shows a floating cream circle (`#F4F1EA`) that slides above the bar.
- Label below the bar updates with the active tab name.

### Home tab

```
Greeting: "Good evening 👋"
LIVE camera card (188px tall, dark gradient, rounded 22px)
  - Red dot + "LIVE"
  - Offline fallback: videocam_off icon + "Camera offline"
Daily challenge CTA (dark pill)
Quick actions row:
  - Feed (restaurant icon, next feed time)
  - Meds (medication icon, due alert)
BrainMax Rating card
  - Large mono rating number
  - Tier badge (Gold III)
Leaderboard CTA
```

### Train tab (becomes the Pet Stats / Avatar hub)

```
Header: "BrainMax" icon + help button
Hero ELO card (dark, rounded 26px):
  - "BRAINMAX RATING" label
  - Large rating number
  - Tier badge + weekly trend
  - 🐱 avatar placeholder (top-right, 62px, animated float)
  - "Whiskers · Trainer Lv.7" + XP progress bar
Daily challenge card (white, black border, shadow)
Skill tree / curriculum row (G1–G5)
Quick stats grid (4 mini cards):
  - streak, accuracy, badges, this week
Leaderboard + Badges CTAs
```

### Pets tab

```
Header: "Your cats"
Pet list rows:
  - 54px rounded square avatar (gradient or initial)
  - Name + active tag
  - Rating + tier
  - check_circle for active, chevron_right for others
"Add a cat" dashed button
```

### Overlays

- Leaderboard sheet (cream background, slide up)
- Badges sheet
- Profile sheet
- Training session overlay (dark, REC indicator, countdown, demo loop)

---

## 4. The problem

- Pets are flat photos. There is no delight, identity, or emotional hook.
- The Pets section takes up prime screen real estate but only switches pets.
- There is no progression loop — feeding the pet feels transactional, not rewarding.
- Nothing makes the user want to open the app just to “check on their cat.”

The app needs a standout feature that turns pet care into a habit and a shareable moment.

---

## 5. The idea

Replace the Pets section with an **Avatar Stats card** for the active pet. Keep the pet selector, but shrink it into a compact **active-pet navigator**.

### A. Active-pet navigator

- Small horizontal bar below the camera (chips, mini rings, or named pills).
- Tapping switches the active cat and updates the Avatar Stats card.
- Current pet is highlighted.

### B. Avatar Stats card (the new hero)

A game-like character sheet for the focused cat, adapted from the mockup’s Train hub:

- **Hero 3D avatar** of the active pet — interactive, animated, rotatable.
  - Replaces the 🐱 emoji placeholder in the dark hero card.
- **Rating / Looksmax score**
  - Large mono number.
  - Tier badge (Gold III, etc.).
  - Weekly trend.
- **Level & XP bar**
  - “Whiskers · Trainer Lv.7” → rename to care level.
  - XP progress to next level.
- **Status bars / rings** like an RPG character:
  - Hunger / Fullness
  - Hydration
  - Health / medication adherence
  - Happiness / energy
  - Grooming / looks — the **“looksmax”** score
- **Daily challenge / care goal** card
  - e.g., “Feed Whiskers before 8pm · 150 pts”.
- **Quick stats grid**
  - Streak, accuracy, badges, time this week.
- **Leaderboard + Badges CTAs**.
- **Action CTAs**: regenerate avatar, share snapshot, view full 3D.
- **Generation states**: empty (no photo), generating (progress UI), ready (interactive avatar), failed (retry CTA).

### C. Generation flow

1. User adds or updates a pet photo.
2. Backend sends the photo to Meshy AI (`image-to-3d` → `rigging` → `animation`).
3. While generating, the card shows a progress state (percent, fun copy like “Sculpting whiskers…”).
4. When ready, the 3D avatar appears and auto-plays an idle animation.
5. If it fails, show a clear retry CTA.

### D. Vibe

**Pet Tamagotchi meets RPG character sheet.**  
You see your cat. You take care of your cat. You make your cat look max.

---

## 6. What we need from you

Please produce a **design spec** that includes:

1. **User flows**
   - How the user adds a pet photo and triggers avatar generation.
   - How the user switches between pets via the new navigator.
   - How the user interacts with the 3D avatar (rotate, tap to animate, etc.).
   - How generation progress, success, and error states are shown.
   - How the user regenerates the avatar.

2. **Wireframes / high-fidelity mockups**
   - New home screen layout with Avatar Stats card + compact navigator.
   - The Avatar Stats card in all states: empty, generating, ready, failed.
   - Stats visualization options (bars, rings, radial dials).
   - Level / streak badge placement.
   - Full-screen or sheet view for the 3D avatar (if any).
   - Dark and light mode versions.

3. **Component recommendations**
   - Compact active-pet navigator style (chips vs mini rings vs pills).
   - 3D avatar container size and aspect ratio.
   - Stats component style.
   - Badge / level component style.
   - Whether to reuse `DemoDrawer` / `ActivityDrawer` sheet pattern for any sub-flows.

4. **Motion & micro-interactions**
   - How the avatar animates on state changes.
   - How stats animate when they update.
   - How switching pets transitions the card.

5. **API contract suggestions**
   - `POST /pets/:id/avatar` — start generation.
   - `GET /pets/:id/avatar` — poll status / get result.
   - `DELETE /pets/:id/avatar` — remove avatar.
   - Fields needed on `Pet` (avatar status, GLB URL, stats).
   - How stats are computed/decay on the backend.

6. **State management notes**
   - Where active-pet state lives.
   - How generation progress is polled (REST polling vs WebSocket push).

7. **Accessibility & touch targets**
   - Minimum 44 dp tap targets.
   - Labels for stats and badges.
   - Fallbacks when 3D fails to load.

---

## 7. Constraints

- **Renderer**: WebView + Google `<model-viewer>` for the 3D avatar. Do not design around a full game engine.
- **Replaces Pets section**: the large ring tray goes away; it becomes a compact navigator.
- **Existing design system**: use colors in `src/theme.ts`, 8pt spacing grid, radius tokens, shadow tokens, Ionicons via `src/Icon.tsx`. Adapt to the mockup palette where it improves the design.
- **No notifications**: do not add push or banner reminders.
- **Mobile-first**; tablet support is nice-to-have.
- **Keep it stupidly simple**: one hero card, one navigator, clear states.
- **Marketing ideas are out of scope for v1** (ads, Instagram, Kling AI content).

---

## 8. Files to look at

- `App.tsx` — current screen layout, live camera, alert banner, Pets section.
- `src/PetsVariants.tsx` — current pet selector ring tray.
- `src/PetAvatar.tsx` — how pet photos are rendered today.
- `src/types.ts` — Pet / Medication / FoodOption types.
- `src/theme.ts` — colors, spacing, radius, shadows.
- `src/api.ts` — current REST client.
- `src/petStatus.ts` — how status is derived from logs.
- `docs/design-request-food-medication-drawer.md` — format reference.
- `BrainMax Hub.html` — visual reference mockups.

---

## 9. Success criteria

A user should be able to:

1. Open the app and see the active cat’s 3D avatar in the new Avatar Stats card.
2. Switch between pets using the compact navigator and see the card update.
3. Add/change a pet photo and watch the avatar generate with clear progress.
4. See at least 3 gamified stats (e.g., hunger, health, looks) update based on care activity.
5. Tap to regenerate the avatar if something goes wrong.

---

## 10. Open questions for you to resolve

- **Navigator style**: chips, mini rings, or named pills?
- **Stats visualization**: horizontal bars, radial rings, or vertical meters?
- **Stats for v1**: should we ship all five (hunger, hydration, health, happiness, looks) or start with a smaller set?
- **Animation triggers**: does tapping the avatar play a random animation, or is there a dedicated action button?
- **Full-screen 3D**: is a sheet/full-screen viewer needed, or is the hero card enough?
- **Auto vs manual generation**: should uploading a pet photo automatically start generation, or should the user tap “Generate avatar”?
- **Looksmax scoring**: how does the looks score increase? Feeding streaks? Manual “groom” action? Time-based decay?

Please answer these in the design spec and propose the simplest path forward.

---

## 11. Marketing ideas captured for later

- Run paid ads around the “looksmax your cat” hook.
- Create an Instagram/TikTok account showing before/after avatar generation.
- Use Kling AI (Henry has a subscription) to generate short video content of the 3D cats.

These are **not part of v1** but are recorded so the design can leave room for shareability.
