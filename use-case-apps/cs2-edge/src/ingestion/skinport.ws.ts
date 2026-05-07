import { io, type Socket } from "socket.io-client";
import * as MsgpackParser from "socket.io-msgpack-parser";
import { SaleFeedEventSchema, type SaleFeedEvent } from "./types.ts";

const SKINPORT_URL = "https://skinport.com";

export type SaleFeedEventHandler = (event: SaleFeedEvent) => void;
export type ErrorHandler = (err: Error) => void;

export interface SkinportWsOptions {
  currency?: string;
  locale?: string;
  appId?: number;
  /** Initial reconnect delay in ms (doubles on each attempt, max 30s). */
  reconnectDelayMs?: number;
  /** Override the Socket.IO server URL (for testing). */
  serverUrl?: string;
}

export class SkinportWsHandler {
  private socket: Socket | null = null;
  private onEventHandlers: SaleFeedEventHandler[] = [];
  private onErrorHandlers: ErrorHandler[] = [];
  private readonly opts: Required<SkinportWsOptions>;

  constructor(opts: SkinportWsOptions = {}) {
    this.opts = {
      currency: opts.currency ?? "USD",
      locale: opts.locale ?? "en",
      appId: opts.appId ?? 730,
      reconnectDelayMs: opts.reconnectDelayMs ?? 1000,
      serverUrl: opts.serverUrl ?? SKINPORT_URL,
    };
  }

  onEvent(handler: SaleFeedEventHandler): this {
    this.onEventHandlers.push(handler);
    return this;
  }

  onError(handler: ErrorHandler): this {
    this.onErrorHandlers.push(handler);
    return this;
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.opts.serverUrl, {
      parser: MsgpackParser,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: this.opts.reconnectDelayMs,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.3,
    });

    this.socket.on("connect", () => {
      this.socket!.emit("saleFeedJoin", {
        currency: this.opts.currency,
        locale: this.opts.locale,
        appid: this.opts.appId,
      });
    });

    this.socket.on("saleFeed", (raw: unknown) => {
      const result = SaleFeedEventSchema.safeParse(raw);
      if (!result.success) {
        this.emitError(new Error(`SaleFeed parse error: ${result.error.message}`));
        return;
      }
      for (const handler of this.onEventHandlers) {
        handler(result.data);
      }
    });

    this.socket.on("connect_error", (err: Error) => {
      this.emitError(err);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  private emitError(err: Error): void {
    for (const handler of this.onErrorHandlers) {
      handler(err);
    }
  }
}
