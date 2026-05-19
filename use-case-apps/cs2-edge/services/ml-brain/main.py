from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import xgboost as xgb
import os

app = FastAPI(title="CS2 Edge ML Brain")

# Placeholder for the model
model = None
MODEL_PATH = "models/model_v1.json"

@app.on_event("startup")
async def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = xgb.Booster()
        model.load_model(MODEL_PATH)
        print(f"✅ Model loaded from {MODEL_PATH}")
    else:
        print("⚠️ No model found. Inference will return placeholder values.")

class PriceFeatures(BaseModel):
    itemId: str
    minPrice: float
    medianPrice: float
    volume24h: int
    # Future features will be added here
    priceMomentum: Optional[float] = 0.0

class PredictionResponse(BaseModel):
    itemId: str
    predictedValue: float
    confidence: float

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict", response_model=List[PredictionResponse])
async def predict(features: List[PriceFeatures]):
    if not model:
        # Fallback to a mock prediction if model isn't trained yet
        return [
            PredictionResponse(
                itemId=f.itemId, 
                predictedValue=f.medianPrice * 0.95, # Mock: slightly lower than median
                confidence=0.5
            ) for f in features
        ]
    
    try:
        # Prepare data for inference
        df = pd.DataFrame([f.dict() for f in features])
        # Note: Feature engineering steps would go here to match training data
        dmatrix = xgb.DMatrix(df.drop(columns=['itemId']))
        preds = model.predict(dmatrix)
        
        return [
            PredictionResponse(
                itemId=features[i].itemId,
                predictedValue=float(preds[i]),
                confidence=0.85 # Placeholder for actual confidence logic
            ) for i in range(len(features))
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
