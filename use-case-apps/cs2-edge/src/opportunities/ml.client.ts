import { Marketplace } from "@prisma/client";

export interface MLPrediction {
  itemId: string;
  predictedValue: number;
  confidence: number;
}

export interface MLFeatures {
  itemId: string;
  minPrice: number;
  medianPrice: number;
  volume24h: number;
  priceMomentum?: number;
}

export class MLClient {
  private baseUrl: string | null;
  private warnedUnavailable = false;

  constructor(baseUrl: string | null = process.env["ML_SERVICE_URL"]?.trim() || null) {
    this.baseUrl = baseUrl;
  }

  async predict(features: MLFeatures[]): Promise<MLPrediction[]> {
    if (!this.baseUrl) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
      });

      if (!response.ok) {
        throw new Error(`ML Service responded with ${response.status}`);
      }

      return (await response.json()) as MLPrediction[];
    } catch (err) {
      if (!this.warnedUnavailable) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[ml-client] ML disabled after prediction failure: ${message}`);
        this.warnedUnavailable = true;
      }
      this.baseUrl = null;
      return []; // Return empty for fallback logic to kick in
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.baseUrl) {
      return false;
    }

    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
