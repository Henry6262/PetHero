"""Example robot worker for PetHero.

Connects to the backend's /ws/robot channel and prints each approved dispense
command. This is the template for the *robot side*: where it prints, you drive
your LeRobot / LeLab motion (scripted joints or a recorded policy replay).

Run the backend first, then:  python robot_worker_example.py
Requires: pip install websockets
"""

import asyncio
import json

URL = "ws://localhost:8000/ws/robot"


async def run() -> None:
    import websockets  # local import so the backend doesn't depend on it

    async with websockets.connect(URL) as ws:
        print(f"[robot] connected to PetHero at {URL}")
        async for raw in ws:
            msg = json.loads(raw)
            if msg.get("type") != "command":
                print(f"[robot] {msg}")
                continue

            action = msg["action"]
            pet = msg.get("pet_name") or msg.get("pet_id") or "?"
            print(f"[robot] COMMAND: {action} for {pet} -> {msg}")

            # ---- Plug your LeRobot motion here -----------------------------
            # e.g. tip the food cup / drop the pill into msg["bowl"].
            #   if action == "feed":     run_feed_policy(grams=msg["amount_grams"])
            #   elif action == "medicine": run_pill_drop(msg["medicine_name"])
            #   elif action == "water":  run_water_pump()
            # ----------------------------------------------------------------


if __name__ == "__main__":
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        print("\n[robot] stopped")
