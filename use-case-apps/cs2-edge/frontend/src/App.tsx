import { useEffect } from "react";
import { Sidebar } from "./components/shell/Sidebar";
import { MatchmakingBanner } from "./components/shell/MatchmakingBanner";
import { AppRouter } from "./router";
import { useUserStore } from "./lib/stores/user.store";
import { useWalletStore } from "./lib/stores/wallet.store";
import { initSocket } from "./lib/socket";
import * as api from "./lib/api";

export default function App() {
  const { setUser } = useUserStore();
  const { fetchBalance } = useWalletStore();

  useEffect(() => {
    // On mount: check auth + load balance
    api.getMe().then((user) => {
      if (user) {
        setUser({
          id: user.id,
          steamId: user.steamId,
          steamName: user.steamName,
          avatar: user.avatarUrl ?? "",
        });
        fetchBalance();
        initSocket(user.id);
      }
    });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-casino-bg">
      <Sidebar />
      <main className="relative flex-1 overflow-auto">
        <AppRouter />
      </main>
      <MatchmakingBanner />
    </div>
  );
}
