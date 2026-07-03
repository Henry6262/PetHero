import { useMemo, useState } from "react";
import AnimatedList from "./react-bits/AnimatedList/AnimatedList";
import Counter from "./react-bits/Counter/Counter";
import MagicBento from "./react-bits/MagicBento/MagicBento";
import SpotlightCard from "./react-bits/SpotlightCard/SpotlightCard";
import DroneHero from "./components/DroneHero";
import OperatorNav from "./components/OperatorNav";
import OperatorDashboard from "./components/OperatorDashboard";
import { contextCards, events, fleet, playbooks } from "./data/sections";

function App() {
  const [bandwidth, setBandwidth] = useState(18);
  const packetRate = useMemo(() => Math.max(7, Math.round(1000 - bandwidth * 51)), [bandwidth]);
  const mbps = useMemo(() => Number((10 - bandwidth * 0.098).toFixed(1)), [bandwidth]);
  const route = window.location.pathname.replace(/\/+$/, "");

  if (route === "/dashboard") {
    return <OperatorDashboard />;
  }

  return (
    <main>
      <OperatorNav active="landing" />
      <section className="hero">
        <DroneHero />
        <div className="hero-copy">
          <p className="eyebrow">Operator / Context Mesh</p>
          <h1>Shared mission memory for disconnected robotic teams.</h1>
          <p>
            Every agent launches with the latest map context, stale zones, provenance,
            and conflicts. The dock is not just a charger. It is mission memory.
          </p>
        </div>
      </section>

      <section className="section bento-wrap">
        <div className="section-head">
          <p className="eyebrow">Context Layer</p>
          <h2>The boring grid becomes the mission brain.</h2>
        </div>
        <MagicBento
          cards={contextCards}
          glowColor="52, 211, 153"
          enableTilt
          enableStars
          enableSpotlight
          enableBorderGlow
          clickEffect={false}
          enableMagnetism={false}
        />
      </section>

      <section className="section mission">
        <div className="mission-map">
          <div className="map-overlay">
            {Array.from({ length: 48 }).map((_, index) => (
              <span key={index} className={`cell cell-${index % 7}`} />
            ))}
            <span className="agent q1">Q1</span>
            <span className="agent h1">H1</span>
            <span className="agent d1">D1</span>
            <span className="route" />
          </div>
        </div>
        <div className="mission-side">
          <p className="eyebrow">Mission Control</p>
          <h2>Watch context move through the team.</h2>
          <AnimatedList items={events} displayScrollbar={false} showGradients className="operator-list" />
        </div>
      </section>

      <section className="section fleet-section">
        <div className="section-head">
          <p className="eyebrow">Fleet</p>
          <h2>Robots, drones, dock, and operator devices all speak the same state.</h2>
        </div>
        <div className="fleet-grid">
          {fleet.map((agent) => (
            <SpotlightCard key={agent.id} className="fleet-card" spotlightColor="rgba(52, 211, 153, 0.18)">
              <div className="fleet-top">
                <span style={{ borderColor: agent.accent, color: agent.accent }}>{agent.id}</span>
                <small>{agent.trust}</small>
              </div>
              <h3>{agent.kind}</h3>
              <p>{agent.status}</p>
              <div className="signal" style={{ background: `linear-gradient(90deg, ${agent.accent}, transparent)` }} />
            </SpotlightCard>
          ))}
        </div>
      </section>

      <section className="section dock-flow">
        <SpotlightCard className="dock-panel" spotlightColor="rgba(95, 178, 255, 0.2)">
          <p className="eyebrow">Dock Magic Moment</p>
          <h2>Q1 learns. The dock remembers. H1 launches smarter.</h2>
          <div className="dock-steps">
            <span>Q1 Upload</span>
            <span>Merge v18</span>
            <span>H1 Initialize</span>
          </div>
        </SpotlightCard>
        <div className="metric-card">
          <span className="metric-label">Path Saved</span>
          <Counter value={54} fontSize={72} textColor="#34d399" fontWeight={700} gradientFrom="#06080c" />
          <strong>%</strong>
          <p>H1 skips dead ends discovered by Q1 and reaches the target with fewer cells.</p>
        </div>
      </section>

      <section className="section bandwidth">
        <div>
          <p className="eyebrow">Bandwidth</p>
          <h2>Drag from video-first to meaning-first.</h2>
          <input
            aria-label="Packet compression"
            type="range"
            min="0"
            max="100"
            value={bandwidth}
            onChange={(event) => setBandwidth(Number(event.target.value))}
          />
        </div>
        <div className="bandwidth-metrics">
          <div><span>Video stream</span><strong>{mbps} Mbps</strong></div>
          <div><span>Context packets</span><strong>{packetRate} bps</strong></div>
          <div><span>Mode</span><strong>{bandwidth > 62 ? "Heartbeat" : bandwidth > 32 ? "Deltas" : "Video"}</strong></div>
        </div>
      </section>

      <section className="section playbook-section">
        <div className="section-head">
          <p className="eyebrow">Playbooks</p>
          <h2>Visible tactics, not hidden autonomy.</h2>
        </div>
        <div className="playbook-grid">
          {playbooks.map(([name, text]) => (
            <SpotlightCard key={name} className="playbook-card" spotlightColor="rgba(251, 191, 36, 0.16)">
              <h3>{name}</h3>
              <p>{text}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
