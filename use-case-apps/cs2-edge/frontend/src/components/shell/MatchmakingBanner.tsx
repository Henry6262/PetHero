import { createPortal } from "react-dom";
import { useCoinflipStore } from "../../games/coinflip/coinflip.store";
import * as api from "../../lib/api";
import { useWalletStore } from "../../lib/stores/wallet.store";
import { cn } from "../../lib/utils";

export function MatchmakingBanner() {
  const { phase, gameId, mySide, game, reset } = useCoinflipStore();
  const { fetchBalance } = useWalletStore();

  const isWaiting = phase === "waiting";
  if (!isWaiting) return null;

  async function handleCancel() {
    if (!gameId) return;
    await api.cancelGame(gameId);
    await fetchBalance();
    reset();
  }

  return createPortal(
    <div
      className={cn(
        "fixed bottom-0 left-[60px] right-0 z-50",
        "flex items-center justify-between",
        "h-12 px-6",
        "bg-casino-surface border-t border-casino-gold/20",
        "grain-panel"
      )}
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="animate-pulse text-casino-gold">●</span>
        <span className="text-foreground font-medium">
          Waiting for opponent
        </span>
        {game && (
          <span className="text-muted-foreground">
            — ${Number(game.amount).toFixed(2)} · {mySide} side
          </span>
        )}
      </div>
      <button
        onClick={handleCancel}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded border border-casino-border hover:border-foreground/30"
      >
        Cancel
      </button>
    </div>,
    document.body
  );
}
