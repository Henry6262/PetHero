import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

const CoinflipPage = lazy(() => import("./games/coinflip/CoinflipPage"));

function GamePlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      {name} — coming soon
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground">Loading…</div>}>
      <Routes>
        <Route path="/" element={<Navigate to="/coinflip" replace />} />
        <Route path="/coinflip" element={<CoinflipPage />} />
        <Route path="/crash"     element={<GamePlaceholder name="Crash" />} />
        <Route path="/cases"     element={<GamePlaceholder name="Cases" />} />
        <Route path="/plinko"    element={<GamePlaceholder name="Plinko" />} />
        <Route path="/roulette"  element={<GamePlaceholder name="Roulette" />} />
        <Route path="/blackjack" element={<GamePlaceholder name="Blackjack" />} />
      </Routes>
    </Suspense>
  );
}
