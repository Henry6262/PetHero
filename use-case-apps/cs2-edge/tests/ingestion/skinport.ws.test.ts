import { describe, test, expect, mock, beforeEach } from "bun:test";
import { SkinportWsHandler } from "../../src/ingestion/skinport.ws.ts";

// ─── Minimal Socket mock ──────────────────────────────────────────────────────

type EventMap = Map<string, ((...args: unknown[]) => void)[]>;

function makeSocketMock() {
  const handlers: EventMap = new Map();
  let _connected = false;

  const socket = {
    connected: false,
    get _connected() { return _connected; },
    on(event: string, cb: (...args: unknown[]) => void) {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event)!.push(cb);
      return socket;
    },
    emit(event: string, ..._args: unknown[]) {
      // record emit calls
      emitCalls.push({ event, args: _args });
      return socket;
    },
    disconnect() { _connected = false; socket.connected = false; },
    // test helpers
    triggerConnect() {
      _connected = true;
      socket.connected = true;
      handlers.get("connect")?.forEach(cb => cb());
    },
    triggerEvent(event: string, data: unknown) {
      handlers.get(event)?.forEach(cb => cb(data));
    },
    triggerConnectError(err: Error) {
      handlers.get("connect_error")?.forEach(cb => cb(err));
    },
  };

  const emitCalls: { event: string; args: unknown[] }[] = [];

  return { socket, emitCalls, handlers };
}

// ─── Mock socket.io-client ────────────────────────────────────────────────────

let mockSocket: ReturnType<typeof makeSocketMock>["socket"];
let emitCalls: ReturnType<typeof makeSocketMock>["emitCalls"];

mock.module("socket.io-client", () => ({
  io: (_url: string, _opts: unknown) => {
    const m = makeSocketMock();
    mockSocket = m.socket;
    emitCalls = m.emitCalls;
    return m.socket;
  },
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const validSaleFeedPayload = {
  eventType: "listed",
  sales: [
    {
      id: 1,
      saleId: 101,
      shortId: "abc123",
      appid: 730,
      marketHashName: "AK-47 | Redline (Field-Tested)",
      marketName: "AK-47 | Redline",
      salePrice: 1250,
      suggestedPrice: 1300,
      referencePrice: 1275,
      currency: "USD",
      wear: 0.15,
      pattern: 42,
      lock: null,
      stattrak: false,
      souvenir: false,
      rarity: "Classified",
      rarityColor: "d2691e",
      exterior: "Field-Tested",
      type: "Rifle",
      stickers: [],
      charms: [],
      tags: [],
      fade: null,
      blue: null,
      image: "/img/ak47.png",
      url: "ak-47-redline-field-tested",
    },
  ],
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SkinportWsHandler", () => {
  let handler: SkinportWsHandler;

  beforeEach(() => {
    handler = new SkinportWsHandler({ serverUrl: "http://mock.skinport.test" });
  });

  test("emits saleFeedJoin with correct params on connect", () => {
    handler = new SkinportWsHandler({
      serverUrl: "http://mock.skinport.test",
      currency: "EUR",
      locale: "de",
      appId: 730,
    });
    handler.connect();
    mockSocket.triggerConnect();

    const joinCall = emitCalls.find(c => c.event === "saleFeedJoin");
    expect(joinCall).toBeDefined();
    expect(joinCall?.args[0]).toEqual({ currency: "EUR", locale: "de", appid: 730 });
  });

  test("calls onEvent handler with parsed event on valid saleFeed", () => {
    const received: unknown[] = [];
    handler.onEvent(evt => received.push(evt));
    handler.connect();
    mockSocket.triggerConnect();
    mockSocket.triggerEvent("saleFeed", validSaleFeedPayload);

    expect(received).toHaveLength(1);
    const evt = received[0] as typeof validSaleFeedPayload;
    expect(evt.eventType).toBe("listed");
    expect(evt.sales[0]?.marketHashName).toBe("AK-47 | Redline (Field-Tested)");
    expect(evt.sales[0]?.salePrice).toBe(1250);
  });

  test("accepts null charm pattern values from feed payloads", () => {
    const received: unknown[] = [];
    handler.onEvent(evt => received.push(evt));
    handler.connect();
    mockSocket.triggerConnect();
    mockSocket.triggerEvent("saleFeed", {
      ...validSaleFeedPayload,
      sales: [
        {
          ...validSaleFeedPayload.sales[0],
          charms: [
            {
              name: "Charm | Test",
              name_localized: "Charm | Test",
              img: "/img/charm.png",
              pattern: null,
              slug: "charm-test",
              value: null,
            },
          ],
        },
      ],
    });

    expect(received).toHaveLength(1);
    const evt = received[0] as { sales: Array<{ charms: Array<{ pattern: number | null }> }> };
    expect(evt.sales[0]?.charms[0]?.pattern).toBeNull();
  });

  test("handles 'sold' eventType correctly", () => {
    const received: unknown[] = [];
    handler.onEvent(evt => received.push(evt));
    handler.connect();
    mockSocket.triggerConnect();
    mockSocket.triggerEvent("saleFeed", { ...validSaleFeedPayload, eventType: "sold" });

    expect((received[0] as { eventType: string }).eventType).toBe("sold");
  });

  test("calls onError handler when saleFeed payload fails validation", () => {
    const errors: Error[] = [];
    handler.onError(e => errors.push(e));
    handler.connect();
    mockSocket.triggerConnect();
    // missing required field eventType
    mockSocket.triggerEvent("saleFeed", { sales: [] });

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("parse error");
  });

  test("calls onError handler on connect_error", () => {
    const errors: Error[] = [];
    handler.onError(e => errors.push(e));
    handler.connect();
    mockSocket.triggerConnectError(new Error("ECONNREFUSED"));

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe("ECONNREFUSED");
  });

  test("connected returns false before connect", () => {
    expect(handler.connected).toBe(false);
  });

  test("connected returns true after connect and socket connects", () => {
    handler.connect();
    mockSocket.triggerConnect();
    expect(handler.connected).toBe(true);
  });

  test("disconnect sets connected to false", () => {
    handler.connect();
    mockSocket.triggerConnect();
    handler.disconnect();
    expect(handler.connected).toBe(false);
  });

  test("multiple onEvent handlers all receive the event", () => {
    const a: unknown[] = [];
    const b: unknown[] = [];
    handler.onEvent(e => a.push(e)).onEvent(e => b.push(e));
    handler.connect();
    mockSocket.triggerConnect();
    mockSocket.triggerEvent("saleFeed", validSaleFeedPayload);

    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
  });
});
