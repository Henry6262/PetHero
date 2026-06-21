// Point this at your Mac's LAN IP (run `ipconfig getifaddr en0` on the Mac).
// The iOS Simulator can use localhost; a real phone via Expo Go needs the LAN IP.
// Override at runtime with EXPO_PUBLIC_PETHERO_HOST.

// Production builds set EXPO_PUBLIC_PETHERO_API to the full https URL (see
// eas.json). Dev falls back to your Mac's LAN IP via EXPO_PUBLIC_PETHERO_HOST.
const API = process.env.EXPO_PUBLIC_PETHERO_API;
const HOST = process.env.EXPO_PUBLIC_PETHERO_HOST ?? "192.168.1.133";

// For the hackathon demo, default to the production Railway backend unless a
// local host is explicitly set. Set EXPO_PUBLIC_PETHERO_HOST to switch back.
export const BASE_URL = API ?? (process.env.EXPO_PUBLIC_PETHERO_HOST ? `http://${HOST}:8000` : "https://pethero-backend-production.up.railway.app");
export const WS_URL = `${BASE_URL.replace(/^http/, "ws")}/ws/feed`;
