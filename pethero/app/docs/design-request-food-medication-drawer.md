# Design Request: Food & Medication Creation Drawer

> For: design/agent teammate  
> Project: PetHero (React Native / Expo app)  
> Branch: `feat/trench-royale-launch-polish`  
> Date: 2026-06-20

---

## 1. What PetHero is

PetHero is a smart pet feeder mobile app. The home screen shows:

- A live camera view of the feeding bowl.
- One-tap dispense actions: **Feed**, **Water**, **Medicine**.
- A pet selector (ring tray of cats/dogs).
- An agent panel that explains why a dispense was allowed or blocked.

Backend is FastAPI. The app talks to it over REST + WebSocket.

---

## 2. What we have today

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

## 3. The problem

Food and medication are too abstract:

- **Food**: The user cannot define what food is being served, how much, or on what schedule. `max_portion_grams` and `min_feed_interval_hours` are invisible.
- **Medication**: Meds are hardcoded in seed data (`src/seed.ts`). There is no way to add a new medication, set dose count, interval, or notes.
- **Discovery**: New users won't know they need to edit seed data to configure their pet's diet or prescriptions.

The app feels like a demo because the configuration layer is missing.

---

## 4. The idea

Add a **creation / management drawer** (or sheet) that lets the user configure:

### A. Food options per pet

- Food name (e.g., "Royal Canin Indoor", "Chicken & Rice").
- Default portion in grams (linked to `Pet.max_portion_grams`).
- Minimum interval between feeds in hours (linked to `Pet.min_feed_interval_hours`).
- Optionally: calories per 100g, feeding schedule (morning / evening).

### B. Medications per pet

- Medication name (e.g., "Prednisolone").
- Dose count (number of pills / ml).
- Interval in hours (e.g., every 12h).
- Notes (e.g., "Give with food").
- Optionally: active / paused toggle.

### C. Drawer entry points

1. **Long-press or "edit" badge on a pet avatar** opens a pet detail sheet with tabs/cards for "Food" and "Meds".
2. **A "+" or settings icon in the header** opens a global management sheet.
3. **When dispensing medicine** and no medication exists, prompt the user to add one instead of silently failing.

### D. Drawer behavior

- Reuse the existing sheet pattern: static blur/dim backdrop, sheet slides up from bottom.
- Keep it simple — one sheet at a time. If we need more depth, push sub-sheets or use accordions.
- Use the existing 8pt spacing grid and theme tokens (`src/theme.ts`).

---

## 5. What we need from you

Please produce a **design spec** that includes:

1. **User flows**
   - How the user creates a food option.
   - How the user adds a medication.
   - How the user edits or deletes either.
   - How the dispense buttons behave when no config exists.

2. **Wireframes / high-fidelity mockups**
   - The pet detail / configuration sheet.
   - The food creation form.
   - The medication creation form.
   - Empty states (e.g., "No medications yet").
   - Error / validation states.

3. **Component recommendations**
   - Whether to reuse `DemoDrawer` as a generic `BottomSheet` component.
   - Form inputs: number steppers, text fields, toggle switches, date/time pickers for schedules.
   - List UI for existing food / meds.

4. **API contract suggestions**
   - What endpoints the backend needs (e.g., `POST /pets/{id}/medications`, `PATCH /pets/{id}/food`).
   - How the app should sync config with backend.

5. **State management notes**
   - Should config live in a context, or is local component state enough for now?

6. **Accessibility & touch targets**
   - Minimum 44 dp tap targets.
   - Clear labels for medication names and doses.

---

## 6. Constraints

- Keep it **stupidly simple**. No multi-page wizard if a single form sheet works.
- Use the existing design system: colors in `src/theme.ts`, spacing 8pt grid, Ionicons via `src/Icon.tsx`.
- Target mobile-first; tablet support is a nice-to-have.
- Do not introduce heavy UI libraries unless justified.

---

## 7. Files to look at

- `App.tsx` — current screen layout, `DemoDrawer`, dispense flow.
- `src/AgentPanel.tsx` — how the agent log surfaces decisions.
- `src/PetsVariants.tsx` — pet selector rings/cards.
- `src/DispenseVariants.tsx` — dispense button variants (currently unused on home screen after the camera overlay refactor).
- `src/types.ts` — Pet / Medication types.
- `src/seed.ts` — example pets and medications.
- `src/theme.ts` — colors, spacing, radius, shadows.

---

## 8. Success criteria

A user should be able to open the app, tap into a pet's settings, and within 30 seconds:

1. Set the default food portion.
2. Add a new medication with dose and interval.
3. Return to the home screen and tap "Feed" or "Med" and see the agent use the configured values.

---

## 9. Open questions for you to resolve

- Should food be **global** (shared across pets) or **per-pet**?
- Should medication reminders be push notifications, in-app banners, or both?
- Should we support multiple active food options per pet (e.g., breakfast vs dinner), or one default?
- Should the drawer be a **bottom sheet** or a **full-screen modal**?

Please answer these in the design spec and propose the simplest path forward.
