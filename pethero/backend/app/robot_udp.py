"""UDP client to the robot controller.

The robot runs a UDP listener that accepts one JSON datagram per packet:
    {"cmd": "feed"}              -> dispense to the cat
    {"cmd": "protect"}           -> push the food away
    {"cmd": "pick", "cup": "1"}  -> sort candy into cup 1/2/3

Config (env):
    ROBOT_HOST  default 127.0.0.1   (backend + robot on the same PC)
    ROBOT_PORT  default 5006
Sends are fire-and-forget and never raise — a missing robot must not break the API.
"""
from __future__ import annotations

import json
import os
import socket

ROBOT_HOST = os.environ.get("ROBOT_HOST", "127.0.0.1")
ROBOT_PORT = int(os.environ.get("ROBOT_PORT", "5006"))


def send(cmd: dict) -> bool:
    """Send one JSON datagram over UDP. Returns True on success."""
    try:
        data = json.dumps(cmd).encode("utf-8")
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.sendto(data, (ROBOT_HOST, ROBOT_PORT))
        print(f"[robot_udp] sent {cmd} -> {ROBOT_HOST}:{ROBOT_PORT}")
        return True
    except Exception as e:
        print(f"[robot_udp] send failed ({ROBOT_HOST}:{ROBOT_PORT}): {e}")
        return False
