const state = {
  health: null,
  itemsTotal: 0,
  opportunities: [],
  filteredOpportunities: [],
  metrics: null,
  selectedItemId: null,
};

const el = {
  healthDot: document.getElementById("healthDot"),
  healthText: document.getElementById("healthText"),
  executionMode: document.getElementById("executionMode"),
  lastRefresh: document.getElementById("lastRefresh"),
  heroStatus: document.getElementById("heroStatus"),
  heroNarrative: document.getElementById("heroNarrative"),
  latestCycleSummary: document.getElementById("latestCycleSummary"),
  kpiGrid: document.getElementById("kpiGrid"),
  tableSummary: document.getElementById("tableSummary"),
  opportunitiesBody: document.getElementById("opportunitiesBody"),
  cycleList: document.getElementById("cycleList"),
  attemptList: document.getElementById("attemptList"),
  inspectorLabel: document.getElementById("inspectorLabel"),
  inspectorSummary: document.getElementById("inspectorSummary"),
  snapshotList: document.getElementById("snapshotList"),
  salesList: document.getElementById("salesList"),
  refreshButton: document.getElementById("refreshButton"),
  searchInput: document.getElementById("searchInput"),
  minScoreInput: document.getElementById("minScoreInput"),
  minProfitInput: document.getElementById("minProfitInput"),
  minBuyInput: document.getElementById("minBuyInput"),
  maxBuyInput: document.getElementById("maxBuyInput"),
  minVolumeInput: document.getElementById("minVolumeInput"),
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPct(value) {
  return `${value.toFixed(2)}%`;
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function setHealth(ok) {
  el.healthDot.className = `status-dot ${ok ? "status-dot--live" : "status-dot--offline"}`;
  el.healthText.textContent = ok ? "API Live" : "API Offline";
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} -> ${response.status}`);
  }
  return response.json();
}

function buildKpis() {
  const latestCycle = state.metrics?.latestCycle;
  const scoredAt = state.opportunities[0]?.scoredAt ?? null;
  const cards = [
    {
      label: "Tracked items",
      value: formatNumber(state.itemsTotal),
      foot: "Catalog rows available for review",
    },
    {
      label: "Current opportunities",
      value: formatNumber(state.opportunities.length),
      foot: "Positive score candidates",
    },
    {
      label: "Paper attempts",
      value: formatNumber(state.metrics?.totals?.paperAttempts ?? 0),
      foot: "Persisted dashboardable paper trades",
    },
    {
      label: "Expected paper edge",
      value: formatCurrency(state.metrics?.totals?.expectedNetProfit ?? 0),
      foot: "Not realized PnL",
    },
    {
      label: "Last scored",
      value: scoredAt ? new Date(scoredAt).toLocaleTimeString() : "N/A",
      foot: scoredAt ? new Date(scoredAt).toLocaleDateString() : "Waiting for score output",
    },
    {
      label: "Latest cycle status",
      value: latestCycle?.status ?? "N/A",
      foot: latestCycle?.reason ?? "No execution cycle recorded yet",
    },
  ];

  el.kpiGrid.innerHTML = cards
    .map(
      card => `
        <article class="kpi-card">
          <p class="kpi-label">${card.label}</p>
          <div class="kpi-value">${card.value}</div>
          <div class="kpi-foot">${card.foot}</div>
        </article>
      `,
    )
    .join("");
}

function renderHero() {
  const latestCycle = state.metrics?.latestCycle;
  const top = state.filteredOpportunities[0] ?? state.opportunities[0];

  el.executionMode.textContent = state.metrics?.totals?.paperAttempts > 0 ? "Paper Mode Active" : "Awaiting cycle";
  el.heroStatus.textContent = top
    ? `${state.opportunities.length} live edges loaded`
    : "Engine alive, waiting for valid edges";
  el.heroNarrative.textContent = latestCycle
    ? `Latest cycle ${latestCycle.status.toLowerCase()} with ${latestCycle.qualifiedCount} qualified setups and reason "${latestCycle.reason}".`
    : "No persisted execution cycle yet. The dashboard will populate after the first loop records state.";

  if (!latestCycle) {
    el.latestCycleSummary.innerHTML = `<span class="metric-placeholder">No execution cycle recorded yet</span>`;
    return;
  }

  el.latestCycleSummary.innerHTML = `
    <div class="stat-grid">
      <div class="stat-box">
        <p class="metric-caption">Candidates</p>
        <span class="value">${formatNumber(latestCycle.candidateCount)}</span>
      </div>
      <div class="stat-box">
        <p class="metric-caption">Qualified</p>
        <span class="value">${formatNumber(latestCycle.qualifiedCount)}</span>
      </div>
      <div class="stat-box">
        <p class="metric-caption">Selected</p>
        <span class="value">${latestCycle.selectedItemId ?? "None"}</span>
      </div>
      <div class="stat-box">
        <p class="metric-caption">Expected Net</p>
        <span class="value">${latestCycle.selectedExpectedNetProfit == null ? "N/A" : formatCurrency(latestCycle.selectedExpectedNetProfit)}</span>
      </div>
    </div>
  `;
}

function applyOpportunityFilters() {
  const search = el.searchInput.value.trim().toLowerCase();
  const minScore = Number(el.minScoreInput.value || 0);
  const minProfit = Number(el.minProfitInput.value || 0);
  const minBuy = Number(el.minBuyInput.value || 0);
  const maxBuy = Number(el.maxBuyInput.value || Number.MAX_SAFE_INTEGER);
  const minVolume = Number(el.minVolumeInput.value || 0);

  state.filteredOpportunities = state.opportunities.filter(opportunity => {
    const matchesSearch = !search || opportunity.itemId.toLowerCase().includes(search);
    return (
      matchesSearch &&
      opportunity.score >= minScore &&
      opportunity.expectedProfitPct >= minProfit &&
      opportunity.listedPrice >= minBuy &&
      opportunity.listedPrice <= maxBuy &&
      opportunity.volume24h >= minVolume
    );
  });
}

function renderOpportunities() {
  applyOpportunityFilters();
  el.tableSummary.textContent = `${state.filteredOpportunities.length} of ${state.opportunities.length} opportunities match the current filters`;

  el.opportunitiesBody.innerHTML = state.filteredOpportunities
    .slice(0, 200)
    .map(opportunity => {
      const selected = state.selectedItemId === opportunity.itemId;
      return `
        <tr class="data-row ${selected ? "data-row--selected" : ""}" data-item-id="${escapeHtml(opportunity.itemId)}">
          <td>${escapeHtml(opportunity.itemId)}</td>
          <td class="mono">${opportunity.score.toFixed(2)}</td>
          <td class="mono">${formatPct(opportunity.expectedProfitPct)}</td>
          <td class="mono">${formatCurrency(opportunity.expectedNetProfit)}</td>
          <td class="mono">${formatCurrency(opportunity.listedPrice)}</td>
          <td class="mono">${formatCurrency(opportunity.targetSellPrice)}</td>
          <td class="mono">${formatNumber(opportunity.volume24h)}</td>
          <td class="mono">${opportunity.confidence.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  for (const row of el.opportunitiesBody.querySelectorAll(".data-row")) {
    row.addEventListener("click", () => {
      const itemId = row.getAttribute("data-item-id");
      if (!itemId) return;
      selectOpportunity(itemId);
    });
  }
}

function renderExecution() {
  const cycles = state.metrics?.recentCycles ?? [];
  const attempts = state.metrics?.recentAttempts ?? [];

  el.cycleList.innerHTML = cycles.length
    ? cycles
        .map(
          cycle => `
            <article class="list-item">
              <div class="list-row">
                <span class="list-title">${escapeHtml(cycle.selectedItemId ?? "No selection")}</span>
                <span class="pill ${cycle.status === "PAPER" ? "pill--warn" : cycle.status === "SUCCESS" ? "pill--good" : "pill--bad"}">${cycle.status}</span>
                <span class="muted mono">${formatDate(cycle.executedAt)}</span>
              </div>
              <div class="list-row muted">
                <span>${cycle.candidateCount} candidates</span>
                <span>${cycle.qualifiedCount} qualified</span>
                <span>${cycle.affordableCount} affordable</span>
                <span>${escapeHtml(cycle.reason ?? "N/A")}</span>
              </div>
            </article>
          `,
        )
        .join("")
    : `<span class="metric-placeholder">No cycles recorded yet</span>`;

  el.attemptList.innerHTML = attempts.length
    ? attempts
        .map(
          attempt => `
            <article class="list-item">
              <div class="list-row">
                <span class="list-title">${escapeHtml(attempt.itemId)}</span>
                <span class="pill ${attempt.mode === "PAPER" ? "pill--warn" : "pill--good"}">${attempt.mode}</span>
                <span class="pill ${attempt.status === "SUCCESS" ? "pill--good" : attempt.status === "PAPER" ? "pill--warn" : "pill--bad"}">${attempt.status}</span>
              </div>
              <div class="list-row muted">
                <span class="mono">${formatCurrency(attempt.buyPrice)} buy</span>
                <span class="mono">${formatCurrency(attempt.resellPrice)} target</span>
                <span class="mono">${formatCurrency(attempt.expectedNetProfit)} expected</span>
                <span class="mono">${formatDate(attempt.attemptedAt)}</span>
              </div>
            </article>
          `,
        )
        .join("")
    : `<span class="metric-placeholder">No attempts recorded yet</span>`;
}

async function selectOpportunity(itemId) {
  state.selectedItemId = itemId;
  renderOpportunities();

  const selected = state.opportunities.find(opportunity => opportunity.itemId === itemId);
  el.inspectorLabel.textContent = itemId;

  if (!selected) {
    return;
  }

  el.inspectorSummary.innerHTML = `
    <div class="stat-grid">
      <div class="stat-box">
        <p class="metric-caption">Score</p>
        <span class="value">${selected.score.toFixed(2)}</span>
      </div>
      <div class="stat-box">
        <p class="metric-caption">Expected Profit</p>
        <span class="value">${formatPct(selected.expectedProfitPct)}</span>
      </div>
      <div class="stat-box">
        <p class="metric-caption">Net Edge</p>
        <span class="value">${formatCurrency(selected.expectedNetProfit)}</span>
      </div>
      <div class="stat-box">
        <p class="metric-caption">Volume 24h</p>
        <span class="value">${formatNumber(selected.volume24h)}</span>
      </div>
    </div>
  `;

  el.snapshotList.innerHTML = `<span class="metric-placeholder">Loading snapshot history</span>`;
  el.salesList.innerHTML = `<span class="metric-placeholder">Loading sale history</span>`;

  try {
    const encodedId = encodeURIComponent(itemId);
    const [snapshots, sales, price] = await Promise.all([
      fetchJson(`/items/${encodedId}/snapshots?limit=8`),
      fetchJson(`/items/${encodedId}/sales?limit=8`),
      fetchJson(`/items/${encodedId}/price?marketplace=SKINPORT`).catch(() => null),
    ]);

    if (price) {
      const summary = `
        <div class="stat-grid">
          <div class="stat-box">
            <p class="metric-caption">Current Buy</p>
            <span class="value">${formatCurrency(price.minPrice)}</span>
          </div>
          <div class="stat-box">
            <p class="metric-caption">Median</p>
            <span class="value">${formatCurrency(price.medianPrice)}</span>
          </div>
          <div class="stat-box">
            <p class="metric-caption">Spread</p>
            <span class="value">${formatPct(price.spreadPct)}</span>
          </div>
          <div class="stat-box">
            <p class="metric-caption">Market</p>
            <span class="value">${price.marketplace}</span>
          </div>
        </div>
      `;
      el.inspectorSummary.innerHTML += summary;
    }

    el.snapshotList.innerHTML = snapshots.snapshots.length
      ? snapshots.snapshots
          .map(
            snapshot => `
              <article class="list-item">
                <div class="list-row">
                  <span class="mono">${formatCurrency(Number(snapshot.minPrice))}</span>
                  <span class="muted">floor</span>
                  <span class="mono">${formatCurrency(Number(snapshot.medianPrice))}</span>
                  <span class="muted">median</span>
                </div>
                <div class="list-row muted">
                  <span>${formatNumber(snapshot.volume24h)} volume</span>
                  <span class="mono">${formatDate(snapshot.snappedAt)}</span>
                </div>
              </article>
            `,
          )
          .join("")
      : `<span class="metric-placeholder">No snapshots stored for this item</span>`;

    el.salesList.innerHTML = sales.sales.length
      ? sales.sales
          .map(
            sale => `
              <article class="list-item">
                <div class="list-row">
                  <span class="mono">${formatCurrency(Number(sale.price))}</span>
                  <span class="muted">${sale.marketplace}</span>
                </div>
                <div class="list-row muted">
                  <span class="mono">${formatDate(sale.soldAt)}</span>
                </div>
              </article>
            `,
          )
          .join("")
      : `<span class="metric-placeholder">No sale events stored for this item</span>`;
  } catch (error) {
    el.snapshotList.innerHTML = `<span class="metric-placeholder">Failed to load snapshot history</span>`;
    el.salesList.innerHTML = `<span class="metric-placeholder">Failed to load sale history</span>`;
    console.error(error);
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function refresh() {
  el.refreshButton.disabled = true;
  el.refreshButton.textContent = "Refreshing";

  try {
    const [health, items, opportunities, metrics] = await Promise.all([
      fetchJson("/health"),
      fetchJson("/items?limit=1"),
      fetchJson("/opportunities?marketplace=SKINPORT"),
      fetchJson("/execution/metrics"),
    ]);

    state.health = health;
    state.itemsTotal = items.total;
    state.opportunities = opportunities.opportunities;
    state.metrics = metrics;

    setHealth(health.status === "ok");
    el.lastRefresh.textContent = new Date().toLocaleTimeString();
    buildKpis();
    renderHero();
    renderOpportunities();
    renderExecution();

    if (!state.selectedItemId && state.filteredOpportunities.length > 0) {
      await selectOpportunity(state.filteredOpportunities[0].itemId);
    } else if (state.selectedItemId) {
      await selectOpportunity(state.selectedItemId);
    }
  } catch (error) {
    setHealth(false);
    el.heroStatus.textContent = "Dashboard refresh failed";
    el.heroNarrative.textContent = String(error);
    console.error(error);
  } finally {
    el.refreshButton.disabled = false;
    el.refreshButton.textContent = "Refresh";
  }
}

for (const input of [
  el.searchInput,
  el.minScoreInput,
  el.minProfitInput,
  el.minBuyInput,
  el.maxBuyInput,
  el.minVolumeInput,
]) {
  input.addEventListener("input", () => {
    renderOpportunities();
    renderHero();
  });
}

el.refreshButton.addEventListener("click", refresh);

refresh();
setInterval(refresh, 30000);
