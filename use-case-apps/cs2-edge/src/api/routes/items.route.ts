import { Hono } from "hono";
import { PrismaClient, Marketplace } from "@prisma/client";
import { PricingService } from "../../pricing/pricing.service.ts";

export function itemsRouter(prisma: PrismaClient) {
  const app = new Hono();
  const pricing = new PricingService(prisma);

  // GET /items?page=1&limit=50
  app.get("/", async c => {
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.item.findMany({ skip: offset, take: limit, orderBy: { id: "asc" } }),
      prisma.item.count(),
    ]);

    return c.json({ items, total, page, limit });
  });

  // GET /items/:id/snapshots?limit=50
  app.get("/:id/snapshots", async c => {
    const itemId = decodeURIComponent(c.req.param("id"));
    const limit = Math.min(500, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return c.json({ error: "Item not found" }, 404);

    const snapshots = await prisma.priceSnapshot.findMany({
      where: { itemId },
      orderBy: { snappedAt: "desc" },
      take: limit,
    });

    return c.json({ itemId, snapshots });
  });

  // GET /items/:id/sales?limit=50
  app.get("/:id/sales", async c => {
    const itemId = decodeURIComponent(c.req.param("id"));
    const limit = Math.min(500, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return c.json({ error: "Item not found" }, 404);

    const sales = await prisma.saleEvent.findMany({
      where: { itemId },
      orderBy: { soldAt: "desc" },
      take: limit,
    });

    return c.json({ itemId, sales });
  });

  // GET /items/:id/price — convenience endpoint wrapping PricingService
  app.get("/:id/price", async c => {
    const itemId = decodeURIComponent(c.req.param("id"));
    const marketplaceParam = (c.req.query("marketplace") ?? "SKINPORT").toUpperCase();
    const marketplace = Object.values(Marketplace).includes(marketplaceParam as Marketplace)
      ? (marketplaceParam as Marketplace)
      : Marketplace.SKINPORT;

    const summary = await pricing.getPriceSummary(itemId, marketplace);
    if (!summary) return c.json({ error: "No price data for this item" }, 404);

    return c.json(summary);
  });

  return app;
}
