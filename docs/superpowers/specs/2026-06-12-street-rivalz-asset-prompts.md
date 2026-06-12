# StreetRivalz — Asset Prompts for Meshy / Rodin

**Use these prompts to generate the v1 GLBs.** All cars must follow the **detached-wheels convention** so the renderer can spin wheels, steer, and apply drift lean automatically.

## Detached-wheels convention (non-negotiable)

Every car GLB must contain these named nodes:

- `body` — main chassis, origin at ground center, forward = +Z
- `wheel_FL` — front-left wheel
- `wheel_FR` — front-right wheel
- `wheel_RL` — rear-left wheel
- `wheel_RR` — rear-right wheel

Optional cosmetic nodes:

- `spoiler` — rear wing
- `decals` — logo/decal planes

Rules:

1. Wheels must be separate meshes from the body (not merged).
2. All five nodes share the same world origin / forward axis.
3. Scale should feel kart-sized: roughly 2.5–3 meters long in real-world units.
4. Low-poly game-ready style, single material or few materials, no rigging required.

---

## Car body prompts

### 1. Paper Hands Scooter
> A tiny, goofy three-wheeled scooter kart. Yellow body, oversized front wheel, tiny rear wheels, handlebars, a little paper-hand emblem on the side. Stylized low-poly game asset, cartoonish, 3 meters long, detached wheels named wheel_FL, wheel_FR, wheel_RL, wheel_RR, body node at ground center, forward +Z. Crypto meme racing theme.

### 2. Whale Limo
> A stretched black limousine kart with blinged-out chrome rims, tiny windows, whale-tail spoiler, luxurious low-rider stance. Stylized low-poly game asset, 3 meters long, detached wheels named wheel_FL, wheel_FR, wheel_RL, wheel_RR, body node at ground center, forward +Z. Crypto meme racing theme.

### 3. Jeet Tuk-Tuk
> A rickety auto-rickshaw tuk-tuk kart, orange and blue paint, tin roof, exposed engine, oversized front wheel, two small rear wheels. Stylized low-poly game asset, cartoonish, 3 meters long, detached wheels named wheel_FL, wheel_FR, wheel_RL, wheel_RR, body node at ground center, forward +Z. Crypto meme racing theme.

### 4. Diamond Hands Monster Truck
> A chunky monster truck kart with huge off-road tires, diamond-textured green body, knobby treads, raised suspension, diamond-hands logo on the hood. Stylized low-poly game asset, 3 meters long, detached wheels named wheel_FL, wheel_FR, wheel_RL, wheel_RR, body node at ground center, forward +Z. Crypto meme racing theme.

### 5. Rug Dev Getaway Car
> A sleek purple sports car with a shifty hacker vibe, tinted windows, neon underglow strips, getaway-door lines, slippery aerodynamic body. Stylized low-poly game asset, 3 meters long, detached wheels named wheel_FL, wheel_FR, wheel_RL, wheel_RR, body node at ground center, forward +Z. Crypto meme racing theme.

### 6. MEV Bot F1
> A red Formula 1 style open-wheel racing kart, exposed front wing, slick tires, glass cockpit, aggressive aerodynamics, bot-face livery. Stylized low-poly game asset, 3 meters long, detached wheels named wheel_FL, wheel_FR, wheel_RL, wheel_RR, body node at ground center, forward +Z. Crypto meme racing theme.

---

## Item prompts

Generate each as a small, self-contained GLB prop (~0.5–1 meter). No naming convention required; these are spawned/scaled in code.

### 1. Pump Rocket
> A cartoonish rocket shaped like a green crypto candle, pointed nose, little fins, fire trail particle not included. Low-poly game prop, crypto meme racing theme.

### 2. Rug Pull Trap
> A bear-trap styled like a bear-market icon, sharp metal jaws, red warning glow. Low-poly game prop, crypto meme racing theme.

### 3. FUD Cloud
> A swirling dark cloud of fear, uncertainty and doubt, with angry red eyes and lightning sparks inside. Low-poly game prop, crypto meme racing theme.

### 4. Diamond Shield
> A sparkling blue translucent diamond-shaped energy shield, faceted gem surface, soft glow. Low-poly game prop, crypto meme racing theme.

### 5. Candle Boost
> A thick green upward crypto candle with a flame on top, glowing bullish aura. Low-poly game prop, crypto meme racing theme.

### 6. Liquidation Wave
> A crashing blue wave made of liquid charts and falling red candles, frozen splash shape. Low-poly game prop, crypto meme racing theme.

---

## Item box prompt

> A rotating mystery box crate for a racing game, glowing yellow question mark on each face, slightly metallic, low-poly, 1.2 meters cubed. Crypto meme racing theme.

---

## Track theme prompts

Use these as style references when generating trackside kits in Meshy / Rodin, or as text-to-3D scene prompts.

### 1. Moonaco (marquee street circuit)
> Monaco-style street race track at night on the moon: polished asphalt, neon casino signs, harbor water, yachts, crypto-casino billboards, barrier walls, checkered flags, low gravity sky.

### 2. Candlestick Canyon
> Desert canyon race track with giant red and green candlestick rock formations, crypto chart lines carved into cliffs, sunset lighting, dust clouds.

### 3. The Trenches
> Mud and war-torn race track through trenches, sandbags, barbed wire, tank tread marks, smoky sky, meme-war flags, puddles and mud splashes.

---

## Wheel set prompts (optional alternate wheels)

> Set of 4 matching kart wheels: [chrome rims / off-road treads / slick racing tires / golden crypto rims], detached, low-poly, 0.35 meter radius. Forward axis +Z.

---

## Export checklist

Before a car GLB is accepted:

- [ ] Contains `body`, `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR` nodes
- [ ] Wheels are not merged into body
- [ ] Origin at ground center
- [ ] Forward direction = +Z
- [ ] File size under ~2 MB
- [ ] Single material or material count ≤ 3
