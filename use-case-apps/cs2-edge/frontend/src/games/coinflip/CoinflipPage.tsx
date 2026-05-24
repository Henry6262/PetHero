import { useEffect, useState } from "react";
import * as api from "../../lib/api";
import type { CoinflipGame } from "../../lib/api";
import { useCoinflipStore } from "./coinflip.store";
import { useUserStore } from "../../lib/stores/user.store";
import { useWalletStore } from "../../lib/stores/wallet.store";
import { CoinflipScene } from "./CoinflipScene";
import { cn } from "../../lib/utils";
import { onSocketEvent } from "../../lib/socket";

const QUICK_AMOUNTS = [1, 5, 10, 25, 100];

export default function CoinflipPage() {
  const { phase, setWaiting, setMatched, setResult } = useCoinflipStore();
  const { isAuthenticated, id: userId } = useUserStore();
  const { fetchBalance } = useWalletStore();
  const [openGames, setOpenGames] = useState<CoinflipGame[]>([]);
  const [history, setHistory] = useState<CoinflipGame[]>([]);
  const [side, setSide] = useState<"CT" | "T">("CT");
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll open games every 5s
  useEffect(() => {
    const refresh = async () => {
      const games = await api.getOpenGames();
      setOpenGames(games);
    };
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  // Load history on mount (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    api.getCoinflipHistory().then(setHistory);
  }, [isAuthenticated]);

  // Subscribe to WS events
  useEffect(() => {
    const unsubMatched = onSocketEvent("coinflip:matched", (raw) => {
      const data = raw as { game: CoinflipGame };
      setMatched(data.game);
    });
    const unsubResult = onSocketEvent("coinflip:result", (raw) => {
      const data = raw as { winnerId: string; game: CoinflipGame };
      setResult(data.winnerId, data.game);
      fetchBalance();
    });
    return () => { unsubMatched(); unsubResult(); };
  }, []);

  async function handleCreate() {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    const res = await api.createGame({ amount, side });
    setLoading(false);
    if (!res?.success) {
      setError("Failed to create game. Check your balance.");
      return;
    }
    fetchBalance();
    setWaiting(res.game.id, side);
  }

  async function handleJoin(game: CoinflipGame) {
    if (!isAuthenticated) return;
    setLoading(true);
    const res = await api.joinGame(game.id);
    setLoading(false);
    if (!res?.success) {
      setError("Failed to join game.");
      return;
    }
    fetchBalance();
    const mySide = game.creatorSide === "CT" ? "T" : "CT";
    setWaiting(game.id, mySide);
  }

  // Show 3D scene when matched/flipping/result
  if (phase === "matched" || phase === "flipping" || phase === "result") {
    return <CoinflipScene />;
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Create game */}
      <section className="grain-panel rounded-xl border border-casino-border bg-casino-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Create Game</h2>

        {/* Side selector */}
        <div className="flex gap-3">
          {(["CT", "T"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={cn(
                "flex-1 h-16 rounded-lg border text-sm font-semibold transition-all",
                side === s
                  ? "border-casino-gold bg-casino-gold/10 text-casino-gold glow-gold"
                  : "border-casino-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              {s === "CT" ? "🛡 Counter-Terrorist" : "💣 Terrorist"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium border transition-colors",
                  amount === a
                    ? "border-casino-gold text-casino-gold bg-casino-gold/10"
                    : "border-casino-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                ${a}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amount}
            min={1}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
            className="w-full h-10 px-3 rounded-lg bg-casino-bg border border-casino-border text-foreground text-sm focus:outline-none focus:border-casino-gold/50"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={loading || !isAuthenticated || phase === "waiting"}
          className={cn(
            "w-full h-11 rounded-lg text-sm font-semibold transition-all",
            "bg-casino-gold text-casino-bg hover:bg-casino-gold-dim",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {!isAuthenticated ? "Login to Play" : loading ? "Creating…" : "Create Game"}
        </button>
      </section>

      {/* Open games */}
      <section className="grain-panel rounded-xl border border-casino-border bg-casino-surface p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Open Games ({openGames.length})
        </h2>

        {openGames.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No open games — be the first to create one.
          </p>
        ) : (
          openGames.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between py-2 border-b border-casino-border last:border-0"
            >
              <div className="flex items-center gap-3">
                {game.creator.avatarUrl && (
                  <img src={game.creator.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-casino-border" />
                )}
                <span className="text-sm text-foreground">{game.creator.steamName}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-casino-bg border border-casino-border text-muted-foreground">
                  {game.creatorSide}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-casino-gold">${Number(game.amount).toFixed(2)}</span>
                <button
                  onClick={() => handleJoin(game)}
                  disabled={loading || !isAuthenticated || game.creatorId === userId || phase === "waiting"}
                  className={cn(
                    "px-4 py-1.5 rounded text-xs font-semibold transition-all",
                    "border border-casino-gold/40 text-casino-gold hover:bg-casino-gold/10 hover:glow-gold",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  Join
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* History */}
      {isAuthenticated && history.length > 0 && (
        <section className="grain-panel rounded-xl border border-casino-border bg-casino-surface p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recent Games</h2>
          {history.slice(0, 10).map((game) => {
            const won = game.winnerId === userId;
            return (
              <div key={game.id} className="flex items-center justify-between py-1.5 border-b border-casino-border last:border-0">
                <span className="text-xs text-muted-foreground">
                  vs {game.creatorId === userId ? game.joiner?.steamName : game.creator.steamName}
                </span>
                <span className={cn("text-xs font-semibold", won ? "text-casino-win" : "text-casino-lose")}>
                  {won ? `+$${(Number(game.amount) * 1.96).toFixed(2)}` : `-$${Number(game.amount).toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
