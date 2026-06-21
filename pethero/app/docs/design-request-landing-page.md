# Design Request: PetHero Landing Page (Lovable)

> For: design/agent teammate
> Build tool: **Lovable** (React + Vite + Tailwind)
> Component library: **React Bits** (https://reactbits.dev) — copy-paste components
> 3D: **React Three Fiber** (`@react-three/fiber` + `@react-three/drei`)
> Goal: **Win the hackathon bounty** — Lovable landing page is a submission requirement
> Date: 2026-06-21

---

## 1. The one job of this page

Make a judge (or a pet owner) go *"wait, that's real?"* in the first 3 seconds — by showing a **live, moving 3D model of the PetHero robot** dispensing food, then scrolling into a tight, premium story about how it works and why it's different. It must feel **shippable, not a hackathon hack**.

Headline candidates (pick/iterate):
- **"Your pet's hero."**
- **"The robot that takes care of your cats. So you can just love them."**
- Tagline under it: *Sees who's hungry → decides what they need → feeds the right bowl. Then you Looksmax your cat.*

Primary CTA: **Join the waitlist** (email capture). Secondary: **Watch it work** (scrolls to the demo / plays a clip).

---

## 2. What PetHero is (for copy)

PetHero is an **autonomous pet-care robot + app** for multi-pet homes. A camera identifies *which* pet walked up, an AI decides what that specific animal needs right now — food, water, or medicine — and a robot arm dispenses the correct portion into the correct bowl. Hard safety rules (never double-dose meds, never feed the wrong pet) are enforced in code. You run it from an iPhone app that's secretly a **pet-care RPG**: 3D avatars of your cats, gamified care stats, and a **"Looksmax / BrainMax your cat"** progression with a camera-verified leaderboard of the smartest, best-cared-for cats in the world.

The wedge: **multi-pet + medicine is a genuinely hard, dangerous problem** (wrong pet eating wrong food/meds), and we're the only ones who can *camera-verify* care and cognition.

---

## 3. ⭐ The hero — a live, moving 3D robot

This is the centerpiece. Non-negotiable.

- A **real-time 3D model of the PetHero prototype** (the SO-101 arm + bowls + overhead camera rig) rendered with **React Three Fiber**, **auto-rotating** and running a **looping dispense animation** (the arm scoops/tips into a bowl). Subtle idle float + a slow orbit.
- **Interactive:** drag to orbit, light parallax on mouse move. Soft studio lighting, contact shadow, neutral HDR environment so the materials read premium.
- **Asset:** Henry will generate the model via **Meshy** from photos of the real prototype (rigged + animation). Until then, use a placeholder rigged GLB (we have animated biped GLBs in `pokedex-landing/raw-art/` — Walking/Running/Dance). Drei's `useGLTF` + `useAnimations` plays the clip; `<Stage>` / `<Environment preset="city">` for lighting; `<OrbitControls autoRotate>`.
- Behind the model: a **React Bits animated background** — `Aurora` or `Silk` (warm cream→sand gradient, very subtle) so the robot floats in soft light, not a flat page.

> Web R3F renders GLB animations cleanly (unlike the in-app WebView), so the hero will actually move smoothly here.

---

## 4. Page sections (top → bottom)

1. **Hero** — 3D robot (left or center), headline + sub + waitlist CTA (right/below). Sticky nav fades in on scroll.
2. **The problem** — "Multi-pet homes are a logistics nightmare." 3 quick pain cards (cat eats the dog's food / missed 8am pill / water bowl dry all day). Use `ScrollReveal` / `SpotlightCard`.
3. **How it works** — 3 steps, animated as you scroll: **① See** (camera IDs the pet) → **② Decide** (AI picks food/water/meds + safety) → **③ Dispense** (arm acts). Each step a card with an icon + micro-animation. `AnimatedList` or a horizontal `Stepper`.
4. **The app is an RPG** — phone mockups (use the real app screenshots: Home, BrainMax Hub, 3D cat avatar). Pitch **"Looksmax your cat"** + the camera-verified **leaderboard**. `TiltedCard` / `CardSwap` / `MagicBento` grid of features (3D avatars, stats, daily challenges, leaderboard).
5. **Safety** — "It refuses to double-dose. Ever." Show the blocked-meds beat. One bold statement section, `GradientText` highlight.
6. **Numbers / trust** — `CountUp` stats (e.g., "3 pets, 1 robot", "0 missed pills", reaction time). Even if illustrative, sell the precision.
7. **Built with** — logos/row: Hugging Face (LeRobot), Mistral, ElevenLabs (voice), Meshy. Signals real, modern stack. `LogoLoop` / marquee.
8. **Final CTA** — big waitlist capture over an `Aurora`/`Particles` background. "Be first to give your cat a hero."
9. Footer — minimal, sphinx logo, socials (the Instagram we're spinning up), © PetHero.

---

## 5. React Bits components to use (be generous, it's the requirement)

- **Backgrounds:** `Aurora`, `Silk`, `Particles`, `Beams`, or `DotGrid` (hero + final CTA).
- **Text:** `SplitText` or `BlurText` for the headline reveal; `GradientText` / `ShinyText` for accents; `CountUp` for stats; `ScrollReveal` for section intros.
- **Cards/layout:** `SpotlightCard`, `TiltedCard`, `MagicBento`, `CardSwap`, `Carousel` (phone mockups), `AnimatedList` (how-it-works), `LogoLoop` (built-with).
- **Nav/feel:** `GooeyNav` or a clean sticky glass nav, `ClickSpark` / `Magnet` micro-interactions on the CTA, smooth scroll via `Lenis`.

Henry has the **React Bits Vault** (free + Pro components) — pull from there.

---

## 6. Visual direction

- **Palette:** warm cream `#FBF9F5` / sand `#EFEAE0`, ink `#1B1A17`, a single living-green accent `#16A34A` (matches the app). Premium, calm, a little playful — *Apple-meets-Tamagotchi*, not crypto/neon.
- **Type:** a characterful display (e.g., Hanken Grotesk / Clash Display) for headlines + clean sans for body. Big, confident headlines; generous whitespace.
- **Logo:** the geometric **sphinx-cat** mark (in the app at `assets/icon.png`).
- **Motion:** everything eases in; nothing janky; the 3D robot is the only "loud" element. Respect `prefers-reduced-motion`.

---

## 7. Build notes (Lovable)

- Lovable scaffolds React + Tailwind — React Bits components paste in directly; install `@react-three/fiber @react-three/drei three` for the hero.
- Keep the GLB lazy-loaded + a poster image fallback so first paint is instant (the robot streams in).
- Mobile: 3D hero falls back to an auto-playing **video/GIF** of the same animation if WebGL is heavy on low-end phones.
- Waitlist: wire the email form to a simple endpoint (we can reuse the PetHero backend, or a Lovable/Supabase table).

---

## 8. Ideas parked for later (out of scope for v1, keep in mind)

- Generate short **Kling AI** clips of the 3D cats for the social proof / Instagram section.
- A live **leaderboard widget** pulling the top camera-verified cats.
- "See it feed *your* cat" — upload a pet photo → preview a generated 3D avatar (ties the app's Meshy pipeline to the page).

**v1 deliverable = the page in sections 4, with the section-3 hero being the star.** Make the hero unforgettable; keep the rest tight and premium.
