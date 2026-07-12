"""
Pi Crawler adapter for the EDTH Payload Escort demo.

Role: payload carrier. Follows waypoints, sends camera detections.
"""

import os
import time
from adapter_base import RobotAdapterBase


class PiCrawlerAdapter(RobotAdapterBase):
    def __init__(self):
        super().__init__(
            robot_id=os.environ.get("ROBOT_ID", "crawler-01"),
            role="payload",
            port=int(os.environ.get("ADAPTER_PORT", "5001")),
        )
        self.waypoints = self._load_waypoints()

    def _load_waypoints(self):
        # Mirror of the escort route in Operator.
        return {
            "dock": (48.1374, 11.5755),
            "wp-1": (48.1374179662235, 11.5755),
            "wp-2": (48.137435932447, 11.57551406469761),
            "wp-3": (48.1374538986705, 11.5755),
            "wp-4": (48.137471864893996, 11.57548593530239),
            "checkpoint": (48.1374898311175, 11.5755),
        }

    def handle_command(self, cmd):
        command = cmd.get("command")
        command_id = self._next_command_id()

        if command == "move_to_waypoint":
            wp_id = cmd.get("waypointId")
            if wp_id in self.waypoints:
                self.current_waypoint_id = wp_id
                self.lat, self.lon = self.waypoints[wp_id]
                self._set_state("moving")
                # TODO: replace with real motor call
                return {
                    "ok": True,
                    "commandId": command_id,
                    "state": self.state,
                    "message": f"Moving to {wp_id}",
                }
            return {"ok": False, "commandId": command_id, "message": "Unknown waypoint"}

        if command == "stop":
            self._set_state("busy")
            return {"ok": True, "commandId": command_id, "state": self.state, "message": "Stopped"}

        if command == "scan":
            self._set_state("scanning")
            # Simulated detection report for demo.
            time.sleep(0.2)
            self.send_report("detection", {
                "lat": self.lat,
                "lon": self.lon,
                "alt": 0,
                "classification": "PERSON",
                "confidence": 0.72,
            })
            return {"ok": True, "commandId": command_id, "state": self.state, "message": "Scan complete"}

        if command == "return_to_dock":
            self.current_waypoint_id = "dock"
            self.lat, self.lon = self.waypoints["dock"]
            self._set_state("returning")
            return {"ok": True, "commandId": command_id, "state": self.state, "message": "Returning to dock"}

        return {"ok": False, "commandId": command_id, "message": f"Unsupported command: {command}"}


if __name__ == "__main__":
    PiCrawlerAdapter().run()
