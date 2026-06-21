# PetHero Landing — Mockup Generation Prompts

> Generate these as high-fidelity UI mockups (Gemini / Midjourney / Freepik / Lovable's image input), then feed the images into **Lovable** as design references.
> Generate them **in order with the same tool/seed** so the visual language stays consistent.
> Tip: for the app-showcase section, use the **real app screenshots** instead of generating (Home, BrainMax Hub, 3D avatar).

---

## 0. Master style — paste this at the START of every prompt

```
High-fidelity desktop web landing-page UI mockup, premium light theme. Palette:
warm cream background #FBF9F5, sand panels #EFEAE0, near-black ink text #1B1A17,
ONE living-green accent #16A34A used sparingly. Big confident modern sans-serif
display headlines (Hanken Grotesk / Clash Display feel), clean body text, very
generous whitespace, soft rounded cards (radius ~20px) with subtle warm shadows.
Calm, premium, slightly playful — Apple meets Tamagotchi. Minimal sticky top nav
with a small geometric low-poly sphinx-cat logo on the left. No clutter, no neon,
no crypto vibes. Pixel-crisp, realistic web design, 16:9 desktop viewport.
```

---

## 1. HERO (the star)

```
[MASTER STYLE] — Hero section of "PetHero". Centerpiece on the right: a
photorealistic 3D render of a small white-and-black robotic arm (LeRobot SO-101
style, 6 joints) poised over two shallow pet bowls (kibble + water) on a light
wood/marble surface, caught mid-dispense, floating in a soft cream-to-sand
aurora glow. Left side: a huge two-line headline "Your pet's hero." with a
calm sub-line "Sees who's hungry. Feeds the right bowl. Looks after your cats."
and a green pill button "Join the waitlist" + a ghost link "Watch it work".
Spacious, cinematic, lots of air around the robot.
```

## 2. THE PROBLEM

```
[MASTER STYLE] — A "the problem" section. Centered short headline
"Multi-pet homes are chaos." Below it, three soft white rounded cards in a row,
each with a simple line icon and one line: "The cat eats the dog's food",
"Someone forgot the 8am pill", "The water bowl ran dry while you were at work".
Muted, empathetic, lots of whitespace.
```

## 3. HOW IT WORKS (3 steps)

```
[MASTER STYLE] — A "how it works" section, headline "Three steps. Zero stress."
Three numbered cards left-to-right connected by a thin line: ① SEE — a camera
icon, "A camera spots which pet walked up"; ② DECIDE — a brain/spark icon,
"AI picks food, water, or meds — with hard safety rules"; ③ DISPENSE — a robot-
arm icon, "The arm serves the right portion into the right bowl". Each card soft
white with the green accent on the number. Clean, diagrammatic, premium.
```

## 4. THE APP — "secretly an RPG"  (use real screenshots if possible)

```
[MASTER STYLE] — An app-showcase section, headline "It's secretly a pet-care RPG."
Two or three floating iPhone mockups at a slight tilt showing: (1) a home dashboard
with a live camera panel and cat tiles, (2) a dark "BrainMax" card with a big rating
number, tier badge, and a skill tree, (3) a 3D cat avatar with game-like stat bars.
Around them, small feature chips: "3D avatars", "Looksmax your cat",
"Camera-verified leaderboard", "Daily challenges". Playful but premium.
```

## 5. SAFETY (bold statement)

```
[MASTER STYLE] — A single bold statement section on a dark ink #1B1A17 panel with
cream text: huge line "It refuses to double-dose. Ever." Sub-line in muted cream:
"Safety is enforced in code, not vibes — never the wrong pet, never a second pill."
A small green check badge. Minimal, confident, high-contrast.
```

## 6. NUMBERS / TRUST

```
[MASTER STYLE] — A stats strip with 3–4 big numbers counting up: "3 pets · 1 robot",
"0 missed pills", "<1s to react", "100% camera-verified". Each number huge in ink,
tiny label under it, thin dividers between. Clean and quietly impressive.
```

## 7. BUILT WITH + FINAL CTA

```
[MASTER STYLE] — Bottom of the page. A small "Built with" logo row (Hugging Face,
Mistral, ElevenLabs, Meshy) as muted monochrome marks. Below it, a big final
call-to-action band over a soft green-tinted aurora/particles background: headline
"Be first to give your cat a hero.", an email input + green "Join the waitlist"
button, and a minimal footer with the sphinx-cat logo and social icons.
```

---

## After you generate them
1. Drop the images into **Lovable** as design references (one per section, or a stitched full-page).
2. Point Lovable at the design request (`design-request-landing-page.md`) for copy, structure, and the **React Bits** + **React Three Fiber** requirements.
3. Replace the *generated* hero robot with your real **Meshy** model once it's ready (live, animated, drag-to-orbit).
