import { Html } from "@react-three/drei";
import { cn } from "../../lib/utils";

interface PlayerCardProps {
  player: { steamName: string; avatarUrl?: string | null } | null;
  side: "CT" | "T";
  amount: number;
  position: [number, number, number];
  isWinner: boolean | null; // null = result not yet known
  isLoser: boolean | null;
}

export function PlayerCard({ player, side, amount, position, isWinner, isLoser }: PlayerCardProps) {
  return (
    <Html position={position} center>
      <div
        className={cn(
          "w-36 rounded-xl border p-3 text-center transition-all duration-500",
          "bg-casino-surface/90 backdrop-blur-md",
          isWinner && "border-casino-gold glow-gold-strong scale-110",
          isLoser  && "border-casino-border opacity-40",
          !isWinner && !isLoser && "border-casino-border"
        )}
      >
        {player?.avatarUrl && (
          <img src={player.avatarUrl} alt="" className="w-10 h-10 rounded-full mx-auto mb-2 border border-casino-border" />
        )}
        <p className="text-xs font-medium text-foreground truncate">{player?.steamName ?? "Waiting…"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{side} side</p>
        <p className="text-sm font-semibold text-casino-gold mt-1">${amount.toFixed(2)}</p>
        {isWinner && (
          <p className="text-xs text-casino-win font-semibold mt-1 animate-float-up">
            +${(amount * 1.96).toFixed(2)}
          </p>
        )}
      </div>
    </Html>
  );
}
