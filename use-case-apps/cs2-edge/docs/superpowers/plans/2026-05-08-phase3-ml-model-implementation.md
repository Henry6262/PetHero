# Phase 3: XGBoost Fair Value Model — Implementation Plan

> **Goal:** Deploy a Python-based ML microservice and integrate it into the CS2 Edge ingestion loop to provide predictive pricing.

---

## Task 1: Data Export & Model Training (Offline)

- [ ] **Step 1: Export historical snapshots**
  Create a script `scripts/export-training-data.ts` to dump `PriceSnapshot` and `SaleEvent` data into a CSV format compatible with Pandas.
- [ ] **Step 2: Jupyter Notebook Research**
  Perform EDA (Exploratory Data Analysis) to identify which features (e.g., volume spikes vs. price dips) correlate strongest with future price bounces.
- [ ] **Step 3: Train XGBoost Model**
  Train the model and save it as `model_v1.json`.

---

## Task 2: Python ML Microservice

- [ ] **Step 1: Setup FastAPI project**
  Create `services/ml-brain/` with `requirements.txt` (fastapi, uvicorn, xgboost, pandas).
- [ ] **Step 2: Implement Inference Route**
  Write a `POST /predict` endpoint that loads the model and runs predictions on incoming feature arrays.
- [ ] **Step 3: Dockerize (Optional but Recommended)**
  Ensure the Python environment is isolated and easy to run alongside Bun.

---

## Task 3: Bun Integration (The Bridge)

- [ ] **Step 1: Database Migration**
  Update `prisma/schema.prisma` to include `predictedValue` and `confidence` in the `OpportunityScore` model.
- [ ] **Step 2: Implement MLClient**
  Create `src/opportunities/ml.client.ts` to handle the HTTP communication with the Python service.
- [ ] **Step 3: Update OpportunityService**
  Modify `scoreAll()` to:
  1. Gather history for each item (Features).
  2. Batch call the Python ML service.
  3. Store results in the DB.

---

## Task 4: Fallback & Resilience

- [ ] **Step 1: Logic Fallback**
  If the ML service is unreachable or returns low confidence, ensure `OpportunityService` falls back to the Phase 2 mathematical formula so the system stays operational.
- [ ] **Step 2: Monitoring**
  Add logging to track the "Error Rate" of predictions (Predicted Price vs. Actual Price 48h later).

---

## Task 5: Verification

- [ ] **Smoke Test ML**
  Run `bun smoke-test.ts` updated to check that `predictedValue` is being populated.
- [ ] **Full Suite Run**
  Ensure no regressions in Phase 1 and 2 logic.
