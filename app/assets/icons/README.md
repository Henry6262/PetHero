# PetHero Icons

## Current icons

All UI icons are rendered with **Ionicons** (filled style, matching the header). The source of truth is `src/Icon.tsx`.

## Swapping in 3D assets

When you generate 3D icons from Meshy / Rodin:

1. Export each icon as a **transparent PNG** (recommended size: 128×128 px or 256×256 px).
2. Drop the PNG into this folder as:
   - `feed.png`
   - `water.png`
   - `medicine.png`
   - `agent.png`
   - `notifications.png`
   - `settings.png`
   - `demo.png`
3. In `src/Icon.tsx`, replace the matching `null` in `ICON_3D_ASSETS` with `require("./3d/feed.png")`, etc.

Example:

```ts
const ICON_3D_ASSETS: Record<IconName, ReturnType<typeof require> | null> = {
  feed: require("./3d/feed.png"),
  water: require("./3d/water.png"),
  medicine: require("./3d/medicine.png"),
  agent: null,
  notifications: null,
  settings: null,
  demo: null,
  chevron: null,
};
```

Once the asset is registered, every `<Icon name="feed" />` in the app will render the 3D version automatically.

## True 3D (GLB / GLTF)

If you want interactive 3D models instead of PNG renders, we can add `@react-three/fiber` + `expo-three` later. Keep the PNG route for now — it's lightweight, fast, and works offline.
