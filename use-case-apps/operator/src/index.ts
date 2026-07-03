import { createApp } from "./api/app.ts";

const PORT = Number(process.env["PORT"] ?? "3069");

Bun.serve({
  port: PORT,
  fetch: createApp().fetch,
});

console.log(`[operator] API listening on http://localhost:${PORT}`);
