"""PetHero backend API — what the SwiftUI app talks to.

REST for control + state, WebSocket for the live feed (frames, detections,
agent reasoning, and dispense events). CORS is wide open for the iOS Simulator.
"""

from __future__ import annotations

import asyncio
import base64
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from . import agent, camera, vision
from .models import (
    Detection,
    ManualTrigger,
    ModeRequest,
    Pet,
    SystemStatus,
)
from .orchestrator import autonomous, manual
from .store import store

app = FastAPI(title="PetHero", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- WebSocket fan-out ---------------------------------------------------

class Hub:
    def __init__(self) -> None:
        self._queues: list[asyncio.Queue] = []

    def connect(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=64)
        self._queues.append(q)
        return q

    def disconnect(self, q: asyncio.Queue) -> None:
        if q in self._queues:
            self._queues.remove(q)

    def broadcast(self, message: dict) -> None:
        for q in list(self._queues):
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                pass


hub = Hub()


def _status() -> SystemStatus:
    return SystemStatus(
        mode=store.mode,
        vision_backend=vision.backend_name(),
        agent_backend=agent.backend_name(),
        camera="placeholder",
        pets=len(store.pets()),
    )


def _frame_message(detection: Optional[Detection]) -> dict:
    jpeg = camera.get_frame(detection)
    return {"type": "frame", "jpeg_b64": base64.b64encode(jpeg).decode("ascii")}


def _broadcast_step(result: dict) -> None:
    det: Detection = result["detection"]
    hub.broadcast({"type": "detection", **det.model_dump(mode="json")})
    hub.broadcast({"type": "decision", **result["decision"].model_dump(mode="json")})
    hub.broadcast({"type": "event", **result["event"].model_dump(mode="json")})
    hub.broadcast(_frame_message(det))


# --- REST ----------------------------------------------------------------

@app.get("/status", response_model=SystemStatus)
def get_status() -> SystemStatus:
    return _status()


@app.get("/pets", response_model=list[Pet])
def get_pets() -> list[Pet]:
    return store.pets()


@app.get("/pets/{pet_id}", response_model=Pet)
def get_pet(pet_id: str):
    pet = store.get_pet(pet_id)
    if pet is None:
        return {"error": "not found"}
    return pet


@app.get("/log")
def get_log():
    return [e.model_dump(mode="json") for e in store.log]


@app.post("/mode")
def set_mode(req: ModeRequest):
    try:
        store.set_mode(req.mode)
    except ValueError as e:
        return {"error": str(e)}
    hub.broadcast({"type": "status", **_status().model_dump(mode="json")})
    return _status()


@app.post("/vision/current")
def set_current(pet_id: Optional[str] = None):
    """Demo control: declare which pet is in front of the camera."""
    detection = vision.set_current_pet(pet_id)
    hub.broadcast({"type": "detection", **detection.model_dump(mode="json")})
    hub.broadcast(_frame_message(detection))
    return detection


@app.post("/process")
def process():
    """Run one autonomous step on the current frame."""
    result = autonomous()
    _broadcast_step(result)
    return {
        "detection": result["detection"].model_dump(mode="json"),
        "decision": result["decision"].model_dump(mode="json"),
        "event": result["event"].model_dump(mode="json"),
    }


@app.post("/trigger")
def trigger(req: ManualTrigger):
    """Owner pressed a Feed / Water / Medicine button."""
    result = manual(req)
    _broadcast_step(result)
    return {
        "decision": result["decision"].model_dump(mode="json"),
        "event": result["event"].model_dump(mode="json"),
    }


# --- WebSocket -----------------------------------------------------------

@app.websocket("/ws/feed")
async def ws_feed(ws: WebSocket):
    await ws.accept()
    q = hub.connect()
    await ws.send_json({"type": "status", **_status().model_dump(mode="json")})
    await ws.send_json(_frame_message(vision.identify()))
    try:
        while True:
            try:
                msg = await asyncio.wait_for(q.get(), timeout=1.5)
                await ws.send_json(msg)
            except asyncio.TimeoutError:
                # Heartbeat frame so the live panel stays fresh.
                await ws.send_json(_frame_message(vision.identify()))
    except WebSocketDisconnect:
        pass
    finally:
        hub.disconnect(q)
