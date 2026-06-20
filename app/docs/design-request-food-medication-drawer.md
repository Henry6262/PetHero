# Design Request: Food & Medication Configuration (Automation-First)

> For: design/agent teammate  
> Project: PetHero (React Native / Expo app)  
> Branch: `feat/trench-royale-launch-polish`  
> Date: 2026-06-20

---

## 1. Direction from Henry

- **Food is per-pet.** This is super important.
- **Notifications are overkill.** Skip push/banner reminders entirely.
- **Focus on automation.** We are setting up the machine to auto-dispense based on configured rules.
- The frontend code and API should be **ready to plug into the real backend** when the backend teammate is done.

---

## 2. What PetHero is

PetHero is a smart pet feeder mobile app. The home screen shows:

- A live camera view of the feeding bowl.
- One-tap dispense actions: **Feed**, **Water**, **Medicine**.
- A pet selector (ring tray of cats/dogs).
- An agent panel that explains why a dispense was allowed or blocked.

Backend is FastAPI. The app talks to it over REST + WebSocket.

---

## 3. What we have today

### Data model (see `src/types.ts`)

```ts
export interface Medication {
  name: string;
  dose_count: number;
  interval_hours: number;
  notes: string;
}

export interface Pet {
  id: string;
  name: string;
  species: "cat" | "dog";
  photo_ref: string;
  max_portion_grams: number;
  min_feed_interval_hours: number;
  medications: Medication[];
}
```

- `max_portion_grams` and `min_feed_interval_hours` exist on `Pet`, but there is **no UI to edit them**.
- `medications` is an array, but there is **no UI to add / edit / delete meds**.
- Food itself has no entity — tapping "Feed" just dispenses a default portion.

### Current dispense flow (see `App.tsx`)

1. User taps Feed / Water / Med button on the right side of the live camera.
2. If no pet is selected, a **DemoDrawer** opens to pick a pet.
3. After a pet is picked, `api.trigger(petId, action, medName)` is called.
4. The agent decides whether to allow it based on safety rules.

### Current drawer (`DemoDrawer` in `App.tsx`)

- Only used to **simulate which pet is at the bowl**.
- Has a handle bar, kicker, title, and chips for each pet + "Unknown".
- Recently got a close **X** button.
- Uses `Animated` + `BlurView` backdrop. Sheet slides up; backdrop stays static.

---

## 4. The problem

Food and medication are too abstract:

- **Food**: The user cannot define what food is being served, how much, or on what schedule. `max_portion_grams` and `min_feed_interval_hours` are invisible.
- **Medication**: Meds are hardcoded in seed data (`src/seed.ts`). There is no way to add a new medication, set dose count, interval, or notes.
- **Discovery**: New users won't know they need to edit seed data to configure their pet's diet or prescriptions.

The app feels like a demo because the configuration layer is missing.

---

## 5. The idea

Add a **pet configuration sheet** that lets the user set up per-pet automation rules. The machine then uses these rules to decide when and how much to dispense.

### A. Food options per pet

Each pet has one or more food options. For each option:

- **Name** (e.g., "Royal Canin Indoor", "Chicken & Rice").
- **Portion in grams** — how much to dispense per feeding.
- **Minimum interval between feeds** in hours — safety cooldown.
- **Default flag** — which option the auto-feeder uses by default.
- Optionally: calories per 100g (nice-to-have, not required).

The existing `Pet.max_portion_grams` and `Pet.min_feed_interval_hours` are migrated into the default food option.

### B. Medications per pet

Each pet has a list of medications. For each medication:

- **Name** (e.g., "Prednisolone").
- **Dose count** (number of pills / ml).
- **Interval in hours** (e.g., every 12h).
- **Notes** (e.g., "Give with food").
- **Active / paused** toggle.

The agent uses the interval to decide when the medication is due.

### C. Automation

- When the camera detects a pet, the agent checks:
  - Is food due? (last feed time + default food's `minIntervalHours`)
  - Is any active medication due? (last med time + `interval_hours`)
- If something is due, the agent auto-dispenses with the configured dose/portion.
- Manual taps still work, but respect the same safety intervals.

### D. Entry points

1. **Long-press on a pet avatar** opens the pet configuration sheet.
2. **When tapping Feed/Med** and no food option / medication exists, prompt the user to create one first.

### E. Drawer behavior

- Reuse the existing sheet pattern: static blur/dim backdrop, sheet slides up from bottom.
- Use a single sheet with two sections/cards: **Food** and **Meds**.
- Keep it simple — no multi-page wizard if a single form sheet works.
- Use the existing 8pt spacing grid and theme tokens (`src/theme.ts`).

---

## 6. What we need from you

Please produce a **design spec** that includes:

1. **User flows**
   - How the user creates the first food option for a pet.
   - How the user adds a medication.
   - How the user edits or deletes either.
   - How the dispense buttons behave when no config exists.
   - How the agent log shows automated decisions based on config.

2. **Wireframes / high-fidelity mockups**
   - The pet configuration sheet (Food + Meds cards).
   - The food creation/edit form.
   - The medication creation/edit form.
   - Empty states (e.g., "No food configured yet").
   - Error / validation states.

3. **Component recommendations**
   - Whether to reuse `DemoDrawer` as a generic `BottomSheet` component.
   - Form inputs: number steppers, text fields, toggle switches.
   - List UI for existing food / meds.

4. **API contract suggestions**
   - Endpoints the backend needs (e.g., `PUT /pets/{id}/food-options`, `POST /pets/{id}/medications`).
   - How the app syncs config with backend.
   - What fields the agent needs from the backend to run automation.

5. **State management notes**
   - Should config live in a context, or is local component state enough for now?

6. **Accessibility & touch targets**
   - Minimum 44 dp tap targets.
   - Clear labels for medication names and doses.

---

## 7. Constraints

- **Per-pet only.** No global food catalog.
- **No notifications.** Do not design push or banner reminders.
- **Automation-first.** Every config value should be usable by the agent to make auto-dispense decisions.
- Keep it **stupidly simple**. No multi-page wizard if a single form sheet works.
- Use the existing design system: colors in `src/theme.ts`, spacing 8pt grid, Ionicons via `src/Icon.tsx`.
- Target mobile-first; tablet support is a nice-to-have.
- Do not introduce heavy UI libraries unless justified.

---

## 8. Files to look at

- `App.tsx` — current screen layout, `DemoDrawer`, dispense flow.
- `src/AgentPanel.tsx` — how the agent log surfaces decisions.
- `src/PetsVariants.tsx` — pet selector rings/cards.
- `src/DispenseVariants.tsx` — dispense button variants (currently unused on home screen after the camera overlay refactor).
- `src/types.ts` — Pet / Medication types.
- `src/seed.ts` — example pets and medications.
- `src/theme.ts` — colors, spacing, radius, shadows.
- `src/api.ts` — current REST client.

---

## 9. Success criteria

A user should be able to open the app, long-press a pet, and within 30 seconds:

1. Add a default food option with portion size and interval.
2. Add an active medication with dose and interval.
3. Return to the home screen and see the agent use these values for auto and manual dispenses.

---

## 10. Open questions for you to resolve

- Should we support **multiple food options per pet** (e.g., breakfast vs dinner presets) or just **one default** for v1?
- Should the food/medication forms be **inline in the sheet** or open in a **sub-sheet**?
- Should deleting the last food option **block manual feeding** or fall back to a global default?

Please answer these in the design spec and propose the simplest path forward.
