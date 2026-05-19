import { chromium, type Browser, type Page } from "playwright";

export interface BuyResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export class SkinportBuyClient {
  private readonly sessionToken: string;
  private browser: Browser | null = null;

  constructor() {
    this.sessionToken = process.env.SKINPORT_SESSION_TOKEN || "";
  }

  private async getPage(): Promise<{ page: Page; cleanup: () => Promise<void> }> {
    if (!this.browser) {
      this.browser = await chromium.launch({ 
        headless: process.env.NODE_ENV === "production" 
      });
    }

    const context = await this.browser.newContext();
    
    // Inject session cookie to skip login
    if (this.sessionToken) {
      await context.addCookies([
        {
          name: "connect.sid", // Skinport uses connect.sid for session
          value: this.sessionToken,
          domain: ".skinport.com",
          path: "/",
          httpOnly: true,
          secure: true,
        },
      ]);
    }

    const page = await context.newPage();
    return { 
      page, 
      cleanup: async () => {
        await context.close();
      }
    };
  }

  /**
   * Fetches current account balance on Skinport.
   */
  async getBalance(): Promise<number> {
    if (!this.sessionToken) return 0;

    const { page, cleanup } = await this.getPage();
    try {
      console.log("[skinport-buy] Checking balance...");
      await page.goto("https://skinport.com/account/transactions");
      
      // Selectors might need adjustment. Skinport often shows balance in the header.
      const balanceText = await page.locator(".Account-balance").first().innerText();
      const balance = parseFloat(balanceText.replace(/[^0-9.]/g, ""));
      return isNaN(balance) ? 0 : balance;
    } catch (err) {
      console.error("[skinport-buy] Failed to get balance:", err);
      return 0;
    } finally {
      await cleanup();
    }
  }

  /**
   * Adds an item to cart and executes the purchase using account balance.
   */
  async buyItem(itemId: string, maxPrice: number): Promise<BuyResult> {
    console.log(`[skinport-buy] Attempting to buy ${itemId} for max $${maxPrice}...`);
    
    if (!this.sessionToken) {
      return { success: false, error: "MISSING_SESSION_TOKEN" };
    }

    const { page, cleanup } = await this.getPage();
    try {
      // 1. Navigate to market page for the item, filtered for tradable only
      const marketUrl = `https://skinport.com/market?item=${encodeURIComponent(itemId)}&tradable=1`;
      await page.goto(marketUrl);
      console.log(`[skinport-buy] Navigated to ${marketUrl}`);

      // 2. Find the first (cheapest) listing
      const firstItem = page.locator(".ItemCard").first();
      await firstItem.waitFor({ timeout: 5000 });

      const priceText = await firstItem.locator(".ItemCard-price").innerText();
      const currentPrice = parseFloat(priceText.replace(/[^0-9.]/g, ""));

      if (currentPrice > maxPrice) {
        return { success: false, error: `PRICE_TOO_HIGH ($${currentPrice} > $${maxPrice})` };
      }

      // 3. Add to cart
      console.log(`[skinport-buy] Found item at $${currentPrice}. Adding to cart...`);
      await firstItem.locator("button:has-text('Add to cart')").click();
      
      // 4. Go to cart
      await page.goto("https://skinport.com/cart");
      await page.waitForSelector(".Cart-item");

      // 5. Checkout
      console.log("[skinport-buy] Proceeding to checkout...");
      await page.locator("button:has-text('Proceed to checkout')").click();

      // 6. Final confirmation (This part is high-risk and needs specific selectors)
      // Check for age verification
      const ageCheckbox = page.locator("input[type='checkbox']").first(); // Simplified selector
      if (await ageCheckbox.isVisible()) {
        await ageCheckbox.check();
      }

      // Select "Account Balance" if not selected
      // Note: This logic depends on the specific checkout UI
      const balanceOption = page.locator("text=Account Balance");
      if (await balanceOption.isVisible()) {
        await balanceOption.click();
      }

      // Click "Pay Now" or "Purchase"
      const purchaseButton = page.locator("button:has-text('Purchase')");
      if (await purchaseButton.isVisible() && await purchaseButton.isEnabled()) {
        await purchaseButton.click();
        console.log("[skinport-buy] Purchase button clicked!");
        
        // Wait for success message or redirect
        await page.waitForURL(/.*\/checkout\/success/, { timeout: 15000 });
        const orderId = page.url().split("/").pop();
        
        return { success: true, orderId };
      }

      return { success: false, error: "PURCHASE_BUTTON_NOT_FOUND" };

    } catch (err) {
      console.error("[skinport-buy] Purchase failed:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      await cleanup();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
