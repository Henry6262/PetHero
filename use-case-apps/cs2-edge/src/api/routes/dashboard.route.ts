import { Hono } from "hono";

const indexFile = Bun.file(new URL("../../dashboard/index.html", import.meta.url));
const cssFile = Bun.file(new URL("../../dashboard/dashboard.css", import.meta.url));
const jsFile = Bun.file(new URL("../../dashboard/dashboard.js", import.meta.url));

export function dashboardRouter() {
  const app = new Hono();

  app.get("/", async c => c.html(await indexFile.text()));

  app.get("/dashboard.css", () => {
    return new Response(cssFile, {
      headers: {
        "content-type": "text/css; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  });

  app.get("/dashboard.js", () => {
    return new Response(jsFile, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  });

  return app;
}
