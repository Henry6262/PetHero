type OperatorNavProps = {
  active: "landing" | "dashboard";
};

export default function OperatorNav({ active }: OperatorNavProps) {
  return (
    <nav className="operator-nav" aria-label="Operator navigation">
      <a className="operator-wordmark" href="/">
        <span>OP</span>
        <strong>Operator</strong>
      </a>
      <div className="operator-nav-links">
        <a className={active === "landing" ? "active" : undefined} href="/">Landing</a>
        <a className={active === "dashboard" ? "active" : undefined} href="/dashboard/">Dashboard</a>
      </div>
    </nav>
  );
}
