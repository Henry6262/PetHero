import { io, type Socket } from "socket.io-client";
import { z } from "zod";

const BITSKINS_WS_URL = "wss://ws.bitskins.com";

export const BitskinsListedEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.string(),
  float_value: z.string().optional(),
  image: z.string().optional(),
});

export type BitskinsListedEvent = z.infer<typeof BitskinsListedEventSchema>;

export class BitskinsWsHandler {
  private socket: Socket | null = null;
  private onListedHandlers: ((event: BitskinsListedEvent) => void)[] = [];

  constructor(private readonly url: string = BITSKINS_WS_URL) {}

  onListed(handler: (event: BitskinsListedEvent) => void): this {
    this.onListedHandlers.push(handler);
    return this;
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    this.socket.on("connect", () => {
      console.log("[bitskins-ws] connected, subscribing to inventory_changes");
      this.socket!.emit("subscribe", "inventory_changes");
    });

    this.socket.on("inventory_changes:listed", (data: unknown) => {
      const result = BitskinsListedEventSchema.safeParse(data);
      if (result.success) {
        for (const handler of this.onListedHandlers) {
          handler(result.data);
        }
      } else {
        console.warn("[bitskins-ws] failed to parse listed event:", result.error.message);
      }
    });

    this.socket.on("connect_error", (err: Error) => {
      console.error("[bitskins-ws] connection error:", err.message);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("[bitskins-ws] disconnected:", reason);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
