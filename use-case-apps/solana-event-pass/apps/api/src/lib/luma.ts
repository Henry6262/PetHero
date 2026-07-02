import { config } from '../config.js';

export interface LumaEvent {
  api_id: string;
  name: string;
  description?: string;
  start_at: string;
  end_at: string;
  timezone?: string;
  location?: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
  };
}

export class LumaClient {
  private apiKey: string;
  private baseUrl = 'https://api.lu.ma/public/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listEvents(calendarId?: string): Promise<LumaEvent[]> {
    if (!this.apiKey) {
      throw new Error('LUMA_API_KEY not configured');
    }

    const url = calendarId
      ? `${this.baseUrl}/calendar/list-events?calendar_api_id=${calendarId}`
      : `${this.baseUrl}/calendar/list-events`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Luma API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { entries?: { event: LumaEvent }[] };
    return data.entries?.map((e) => e.event) ?? [];
  }
}

export const lumaClient = config.LUMA_API_KEY ? new LumaClient(config.LUMA_API_KEY) : null;
