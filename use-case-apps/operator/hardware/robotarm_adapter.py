"""
Checkpoint robot arm adapter for the EDTH Payload Escort demo.

Role: checkpoint guardian. actuate lock/unlock lowers/raises a barrier.
"""

import os
from adapter_base import RobotAdapterBase


class RobotArmAdapter(RobotAdapterBase):
    def __init__(self):
        super().__init__(
            robot_id=os.environ.get("ROBOT_ID", "arm-01"),
            role="checkpoint",
            port=int(os.environ.get("ADAPTER_PORT", "5003")),
        )
        self.locked = False

    def handle_command(self, cmd):
        command = cmd.get("command")
        action = cmd.get("action")
        command_id = self._next_command_id()

        if command == "actuate":
            if action == "lock":
                self.locked = True
                self._set_state("busy")
                # TODO: trigger servo / LED red
                return {"ok": True, "commandId": command_id, "state": self.state, "message": "Barrier locked"}
            if action == "unlock":
                self.locked = False
                self._set_state("idle")
                # TODO: trigger servo / LED green
                return {"ok": True, "commandId": command_id, "state": self.state, "message": "Barrier unlocked"}
            return {"ok": False, "commandId": command_id, "message": f"Unknown action: {action}"}

        if command == "stop":
            self._set_state("busy")
            return {"ok": True, "commandId": command_id, "state": self.state, "message": "Stopped"}

        return {"ok": False, "commandId": command_id, "message": f"Unsupported command: {command}"}


if __name__ == "__main__":
    RobotArmAdapter().run()
