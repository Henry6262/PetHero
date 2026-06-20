// Point this at your Mac's LAN IP (run `ipconfig getifaddr en0` on the Mac).
// The iOS Simulator can use localhost; a real phone via Expo Go needs the LAN IP.
// Override at runtime with EXPO_PUBLIC_PETHERO_HOST.

const HOST = process.env.EXPO_PUBLIC_PETHERO_HOST ?? "192.168.1.133";
const PORT = 8000;

export const BASE_URL = `http://${HOST}:${PORT}`;
export const WS_URL = `ws://${HOST}:${PORT}/ws/feed`;
