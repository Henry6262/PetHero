"""
Base HTTP adapter for field robots talking to Operator.

Subclasses implement handle_command() for robot-specific motion/actuation.
Each adapter exposes:
  GET  /health
  POST /command
  POST /report

Reports are HMAC-SHA256 signed using OPERATOR_ROBOT_SECRET.
"""

import hmac
import hashlib
import json
import os
import time
import threading
import requests
from abc import ABC, abstractmethod
from typing import Any, Optional

try:
    from flask import Flask, request, jsonify
except ImportError as e:  # pragma: no cover
    raise SystemExit("Flask is required: pip install flask") from e


class RobotAdapterBase(ABC):
    def __init__(
        self,
        robot_id: str,
        role: str,
        port: int = 5000,
    ):
        self.robot_id = robot_id
        self.role = role
        self.port = port
        self.operator_url = os.environ.get("OPERATOR_URL", "http://localhost:3069")
        self.secret = os.environ.get("ROBOT_SECRET", "demo-robot-secret")

        self.state = "idle"
        self.current_waypoint_id: Optional[str] = None
        self.battery_pct = 100.0
        self.lat = 0.0
        self.lon = 0.0
        self.last_report_at = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())

        self.app = Flask(self.robot_id)
        self._register_routes()

        # Background telemetry thread.
        self._stop_event = threading.Event()
        self._telemetry_thread = threading.Thread(target=self._telemetry_loop, daemon=True)

    def _register_routes(self):
        @self.app.get("/health")
        def health():
            return jsonify({
                "ok": True,
                "robotId": self.robot_id,
                "role": self.role,
                "batteryPct": round(self.battery_pct, 1),
                "state": self.state,
                "currentWaypointId": self.current_waypoint_id,
                "lastReportAt": self.last_report_at,
            })

        @self.app.post("/command")
        def command():
            body = request.get_json(force=True, silent=True) or {}
            ack = self.handle_command(body)
            return jsonify(ack)

        @self.app.post("/report")
        def report():
            # In real use Operator verifies the signature; here we just echo.
            return jsonify({"ok": True})

    @abstractmethod
    def handle_command(self, cmd: dict[str, Any]) -> dict[str, Any]:
        """Return an ack dict: {ok, commandId, state, message}."""
        ...

    def run(self):
        self._telemetry_thread.start()
        try:
            self.app.run(host="0.0.0.0", port=self.port, debug=False, use_reloader=False)
        finally:
            self._stop_event.set()

    def _telemetry_loop(self):
        while not self._stop_event.is_set():
            try:
                self.send_report("telemetry", {
                    "batteryPct": round(self.battery_pct, 1),
                    "lat": self.lat,
                    "lon": self.lon,
                    "state": self.state,
                    "currentWaypointId": self.current_waypoint_id,
                })
                self.battery_pct = max(0.0, self.battery_pct - 0.1)
            except Exception as e:
                print(f"[{self.robot_id}] telemetry failed: {e}")
            time.sleep(2.0)

    def send_report(self, report_type: str, payload: dict[str, Any]):
        report = {
            "type": report_type,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "robotId": self.robot_id,
            "payload": payload,
        }
        body = json.dumps(report, separators=(",", ":"))
        timestamp_ms = int(time.time() * 1000)
        nonce = f"{self.robot_id}-{timestamp_ms}"
        message = f"{body}:{timestamp_ms}:{nonce}"
        signature = hmac.new(
            self.secret.encode(), message.encode(), hashlib.sha256
        ).hexdigest()

        url = f"{self.operator_url}/api/field-bridge/robot-report"
        headers = {
            "X-Robot-Id": self.robot_id,
            "X-Timestamp": str(timestamp_ms),
            "X-Nonce": nonce,
            "X-Signature": signature,
            "Content-Type": "application/json",
        }
        resp = requests.post(url, data=body, headers=headers, timeout=5)
        resp.raise_for_status()
        self.last_report_at = report["timestamp"]

    def _next_command_id(self) -> str:
        return f"CMD-{int(time.time() * 1000)}"

    def _set_state(self, state: str):
        self.state = state
