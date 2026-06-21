"""POST /enforce — the robot's feeding-rule gate (+ /robot/command passthrough).

Kept in its own module (with its own APIRouter) so it survives concurrent
rewrites of main.py. main.py only needs to `include_router` this.

When a food appears in front of a cat the backend decides, then SENDS a TCP
command to the robot (the teammate's TCP server on port 5006):
    allowed + due   -> {"cmd": "feed"}
    not allowed     -> {"cmd": "protect"}
    too soon        -> {"cmd": "protect"}
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from datetime import datetime, timezone

from . import vision, robot_udp
from .robot import robot_hub, RobotCommand
from .store import store
from .hub import hub
from .orchestrator import manual
from .models import ManualTrigger, Action

router = APIRouter()


class EnforceRequest(BaseModel):
    pet_id: Optional[str] = None
    food_id: Optional[str] = None
    food_label: Optional[str] = None
    confidence: float = 1.0


class RawRobotCommand(BaseModel):
    cmd: str                      # "feed" | "protect" | "pick"
    cup: Optional[str] = None     # "1" | "2" | "3" for pick


def _broadcast(result) -> None:
    try:
        hub.broadcast({"type": "detection", **result["detection"].model_dump(mode="json")})
        hub.broadcast({"type": "decision", **result["decision"].model_dump(mode="json")})
        hub.broadcast({"type": "event", **result["event"].model_dump(mode="json")})
    except Exception:
        pass


@router.post("/enforce")
def enforce(req: EnforceRequest):
    # 1) Resolve the cat — explicit pet_id wins, else the current vision detection.
    pet = store.get_pet(req.pet_id) if req.pet_id else None
    if pet is None:
        det = vision.identify()
        if det is not None and getattr(det, "pet_id", None):
            pet = store.get_pet(det.pet_id)
    if pet is None:
        robot_udp.send({"cmd": "protect"})
        return {"allow": False, "action": "push_away", "robot_cmd": "protect",
                "reason": "no cat identified", "pet_name": None, "food": None}

    # 2) Is this food in the cat's allow-list (food_options)?
    food = None
    if req.food_id:
        food = next((f for f in pet.food_options if f.id == req.food_id), None)
    if food is None and req.food_label:
        lbl = req.food_label.strip().lower()
        food = next((f for f in pet.food_options if f.name.strip().lower() == lbl), None)
    label = req.food_label or req.food_id or "that food"
    if food is None:
        robot_udp.send({"cmd": "protect"})
        return {"allow": False, "action": "push_away", "robot_cmd": "protect",
                "reason": f"{pet.name} is not allowed {label}.",
                "pet_name": pet.name, "food": label}

    # 3) Allowed food → run the real feed decision (interval/safety + logging),
    #    then drive the robot over TCP.
    result = manual(ManualTrigger(pet_id=pet.id, action=Action.feed))
    _broadcast(result)
    ev = result["event"]
    allow = bool(getattr(ev, "allowed", False))
    cmd = "feed" if allow else "protect"
    robot_udp.send({"cmd": cmd})
    return {"allow": allow,
            "action": "dispense" if allow else "push_away",
            "robot_cmd": cmd,
            "reason": getattr(ev, "reason", ""),
            "pet_name": pet.name, "food": food.name}


@router.post("/robot/command")
async def robot_command(req: RawRobotCommand):
    """Direct passthrough: app/UI sends feed / protect / pick → robot over UDP + WebSocket."""
    payload: dict = {"cmd": req.cmd}
    if req.cup is not None:
        payload["cup"] = req.cup
    ok = robot_udp.send(payload)

    # Also fan out to any connected robot workers (cloud bridge, etc.)
    action = {"feed": Action.feed, "medicine": Action.medicine}.get(req.cmd, Action.none)
    robot_hub.dispatch(RobotCommand(
        command={"subject": "app", "verb": req.cmd, "object": req.cup, "count": 1},
        action=action,
        pet_id=None,
        pet_name=None,
        amount_grams=0,
        medicine_name=None,
        food_name=None,
        count=1,
        bowl=None,
        issued_at=datetime.now(timezone.utc),
    ))

    return {"sent": ok, "command": payload,
            "robot": f"{robot_udp.ROBOT_HOST}:{robot_udp.ROBOT_PORT}"}
