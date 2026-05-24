import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useRef, useEffect, useState } from "react";
import { Coin, type CoinHandle } from "./Coin";
import { PlayerCard } from "./PlayerCard";
import { useCoinflipStore } from "./coinflip.store";
import { cn } from "../../lib/utils";

export function CoinflipScene() {
  const { phase, game, winnerId, setFlipping, reset } = useCoinflipStore();
  const coinRef = useRef<CoinHandle>(null);
  const [showResult, setShowResult] = useState(false);

  // When matched → transition to flipping after a dramatic 1.5s pause
  useEffect(() => {
    if (phase === "matched") {
      const timer = setTimeout(() => {
        setFlipping();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // When entering flipping phase with a known winner → play the flip animation
  useEffect(() => {
    if (phase === "flipping" && game && winnerId && coinRef.current) {
      const creatorWon = winnerId === game.creatorId;
      const ctWon = creatorWon
        ? game.creatorSide === "CT"
        : game.creatorSide === "T"; // joiner takes opposite side

      coinRef.current.playFlip(ctWon).then(() => {
        setShowResult(true);
      });
    }
  }, [phase]);

  const creator = game?.creator ?? null;
  const joiner  = game?.joiner  ?? null;
  const amount  = game ? Number(game.amount) : 0;

  const creatorWon = winnerId ? winnerId === game?.creatorId : null;
  const joinerWon  = winnerId ? winnerId !== game?.creatorId : null;

  function handlePlayAgain() {
    setShowResult(false);
    reset();
  }

  return (
    <div className="relative w-full h-full bg-casino-bg">
      <Canvas
        camera={{ position: [0, 1, 6], fov: 50 }}
        shadows
        gl={{ antialias: true, toneMapping: 2 /* ACESFilmicToneMapping */ }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
        <pointLight position={[-3, 3, 3]} intensity={0.8} color="#f59e0b" />

        <Environment preset="night" />

        {/* Coin */}
        <Coin ref={coinRef} idleSpin={phase === "matched"} />

        {/* Player cards */}
        <PlayerCard
          player={creator}
          side={game?.creatorSide ?? "CT"}
          amount={amount}
          position={[-3, 0, 0]}
          isWinner={showResult ? creatorWon : null}
          isLoser={showResult ? !creatorWon : null}
        />
        <PlayerCard
          player={joiner}
          side={game?.creatorSide === "CT" ? "T" : "CT"}
          amount={amount}
          position={[3, 0, 0]}
          isWinner={showResult ? joinerWon : null}
          isLoser={showResult ? !joinerWon : null}
        />

        {/* Post-processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.85} intensity={0.5} mipmapBlur />
          <Vignette offset={0.4} darkness={0.6} />
        </EffectComposer>
      </Canvas>

      {/* Play again overlay */}
      {showResult && (
        <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none">
          <button
            onClick={handlePlayAgain}
            className={cn(
              "pointer-events-auto",
              "px-8 py-3 rounded-xl text-sm font-semibold",
              "bg-casino-gold text-casino-bg hover:bg-casino-gold-dim",
              "transition-colors shadow-lg"
            )}
          >
            Play Again
          </button>
        </div>
      )}

      {/* VS text */}
      {(phase === "matched" || phase === "flipping") && !showResult && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-4xl font-bold text-white/10 select-none">VS</span>
        </div>
      )}
    </div>
  );
}
