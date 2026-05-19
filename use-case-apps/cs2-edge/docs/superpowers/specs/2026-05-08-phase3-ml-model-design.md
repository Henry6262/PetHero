# Phase 3: XGBoost Fair Value Model — Design Spec

## Context
Phase 2 provided a mathematical "Opportunity Score" based on current floor vs. median prices. Phase 3 evolves this from **reactive** to **predictive** using a Gradient Boosted Decision Tree (XGBoost) to forecast the "Fair Value" of an item.

## Goal
Predict the resale price of a CS2 item with >90% accuracy over a 48-hour window, enabling the Phase 4 execution layer to buy items that are statistically likely to bounce back or maintain value.

---

## Architecture: Hybrid Bun + Python

Since Bun (TypeScript) excels at high-concurrency ingestion and Python excels at ML inference, we will use a **Microservice Bridge**.

1. **Ingestion (Bun):** Polls Skinport data as usual.
2. **Feature Extraction (Bun):** Aggregates last 24h of `PriceSnapshot` history for an item.
3. **Inference Request (HTTP):** Bun sends features to a Python FastAPI service.
4. **Prediction (Python):** XGBoost model returns `predicted_fair_value` and `confidence_score`.
5. **Storage (Bun):** Writes prediction into `OpportunityScore` table.

---

## Machine Learning Model

### Model Type: XGBoost Regressor
XGBoost is chosen for its superior performance on tabular time-series data and its ability to handle missing values (e.g., items that didn't sell for a few hours).

### Target Variable
- `next_48h_median`: The median price of the item 48 hours after the prediction.

### Features (Input Clues)
| Category | Features |
|---|---|
| **Price** | Current min, 1h/6h/24h min price delta, 24h median price. |
| **Volume** | Current quantity, 24h volume delta, volume/quantity ratio. |
| **Momentum** | Simple Moving Average (SMA) 24h, RSI-style momentum indicator. |
| **Metadata** | Item type (Rifle vs Knife), Rarity, Marketplace ID. |

---

## Data Model Updates

No breaking changes to `OpportunityScore`, but we add a column for ML metadata.

```prisma
// Update to OpportunityScore
model OpportunityScore {
  // ... existing fields ...
  predictedValue    Decimal?    @db.Decimal(12, 2)
  confidence        Float?      @default(0.0)
  modelId           String?     // For tracking which model version made the call
}
```

---

## The Python Microservice (`/services/ml-brain`)

- **Tech Stack:** Python 3.11, FastAPI, XGBoost, Scikit-learn, Pandas.
- **Endpoint:** `POST /predict`
  - Input: Array of feature objects.
  - Output: Array of predictions.

---

## Testing Strategy

| Test | Type | Description |
|---|---|---|
| Model Performance | Offline | Root Mean Squared Error (RMSE) on historical snapshots. |
| Bridge Connectivity | Integration | Bun successfully calls Python and handles timeouts. |
| Fallback Logic | Unit | If Python is down, Bun falls back to the Phase 2 math formula. |

---

## Phase 4 Readiness
By the end of Phase 3, the `OpportunityScore` table will contain "Alpha" signals. A Phase 4 bot will simply need to check:
1. `score > Threshold`
2. `confidence > 0.85`
3. `predictedValue > listedPrice + fees`

If all three are true: **AUTO-BUY.**
