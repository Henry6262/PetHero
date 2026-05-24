import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useUserStore } from "../../lib/stores/user.store";
import { useWalletStore } from "../../lib/stores/wallet.store";

const GAMES = [
  { path: "/coinflip",  label: "Coinflip",  icon: "🪙" },
  { path: "/crash",     label: "Crash",     icon: "🚀" },
  { path: "/cases",     label: "Cases",     icon: "📦" },
  { path: "/plinko",    label: "Plinko",    icon: "🎯" },
  { path: "/roulette",  label: "Roulette",  icon: "🎡" },
  { path: "/blackjack", label: "Blackjack", icon: "🃏" },
] as const;

export function Sidebar() {
  const location = useLocation();
  const { steamName, avatar, isAuthenticated } = useUserStore();
  const { balance } = useWalletStore();

  const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  return (
    <aside
      className={cn(
        "group/sidebar flex flex-col justify-between",
        "h-screen w-[60px] hover:w-[220px]",
        "bg-casino-surface border-r border-casino-border",
        "transition-[width] duration-200 ease-out overflow-hidden",
        "shrink-0 z-40"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3 border-b border-casino-border shrink-0">
        <span className="text-xl shrink-0">⚡</span>
        <span className="ml-3 text-sm font-semibold text-foreground opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 whitespace-nowrap">
          CS2 Edge
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-1 overflow-hidden">
        {GAMES.map(({ path, label, icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center h-10 px-3 mx-2 rounded-md",
                "transition-colors duration-150",
                active
                  ? "bg-casino-gold/10 text-casino-gold glow-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <span className="text-base shrink-0 w-5 text-center">{icon}</span>
              <span className="ml-3 text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User / wallet */}
      <div className="border-t border-casino-border p-3 shrink-0">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {avatar && (
              <img src={avatar} alt={steamName ?? ""} className="w-8 h-8 rounded-full shrink-0 border border-casino-border" />
            )}
            <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{steamName}</p>
              <p className="text-xs text-casino-gold">
                ${balance !== null ? balance.toFixed(2) : "—"}
              </p>
            </div>
          </div>
        ) : (
          <a
            href={`${apiBase}/auth/steam`}
            className={cn(
              "flex items-center h-10 px-3 rounded-md",
              "bg-casino-gold/10 text-casino-gold hover:bg-casino-gold/20",
              "transition-colors duration-150"
            )}
          >
            <span className="text-base shrink-0">🔑</span>
            <span className="ml-3 text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 whitespace-nowrap">
              Login with Steam
            </span>
          </a>
        )}
      </div>
    </aside>
  );
}
