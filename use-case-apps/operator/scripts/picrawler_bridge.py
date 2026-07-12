#!/usr/bin/env python3
"""
PiCrawler bridge for the Operator C2 room-clearance demo.

Runs on the Raspberry Pi 5 attached to the PiCrawler. It polls the Operator
backend for commands, translates them into real robot gaits, runs the camera
detector, and posts telemetry back so the dashboard shows live state + video.

Quick start (simulation, no robot):
    python3 scripts/picrawler_bridge.py --api http://<laptop-ip>:3069

Quick start with the Raspberry Pi AI Camera (IMX500):
    # On the Pi, start the AI camera server (serves MJPEG + posts person detections):
    OPERATOR_API=http://<laptop-ip>:3069 python3 scripts/imx500_camera_server.py
    # Then run the bridge (it only moves the robot; detection is handled by the camera server):
    OPERATOR_API=http://<laptop-ip>:3069 \
    CAMERA_URL=http://<pi-ip>:8080/ \
        python3 scripts/picrawler_bridge.py

Quick start with a USB / Pi Camera v2 feed:
    # Start an MJPEG streamer, e.g.:
    #   mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" \
    #                 -o "output_http.so -p 8080 -w /usr/local/www"
    OPERATOR_API=http://<laptop-ip>:3069 \
    CAMERA_URL=http://<pi-ip>:8080/?action=stream \
        python3 scripts/picrawler_bridge.py --detect opencv

Environment variables:
    OPERATOR_API   - Operator backend URL (default http://localhost:3069)
    CAMERA_URL     - URL of an MJPEG camera feed visible to the dashboard

Hardware integration points are still marked #TODO where you should calibrate
step counts, HSV colour bounds, or swap in your own detector.
"""
import argparse
import os
import time
from typing import Any, Dict, Optional, Tuple

import requests

try:
    from picrawler import Picrawler  # type: ignore

    HAS_PICRAWLER = True
except Exception as e:
    HAS_PICRAWLER = False
    print(f"[bridge] picrawler import failed: {e}")

try:
    import cv2  # type: ignore

    HAS_CV2 = True
except Exception as e:
    HAS_CV2 = False
    print(f"[bridge] opencv import failed: {e}")

try:
    from robot_hat import Pin, Ultrasonic  # type: ignore

    HAS_ULTRASONIC = True
except Exception as e:
    HAS_ULTRASONIC = False
    print(f"[bridge] ultrasonic import failed: {e}")

ROBOT_ID = "SPIDER-01"
DEFAULT_API = os.environ.get("OPERATOR_API", "http://localhost:3069")
DEFAULT_CAMERA = os.environ.get("CAMERA_URL", "")


def init_robot() -> Optional[Any]:
    if not HAS_PICRAWLER:
        return None
    try:
        return Picrawler()
    except Exception as e:
        print(f"[bridge] Picrawler init failed: {e}")
        return None


class GaitPlanner:
    """
    Open-loop room-to-room gait sequences.

    #TODO: calibrate step_count and speed for your demo surface. The PiCrawler
    has no encoders, so distances are approximate. Use short, slow steps for
    stable video and to avoid tipping on carpet/tile transitions.
    """

    # (action, steps). Common actions: forward, backward, turn_left, turn_right, sit.
    ROOM_SEQ: Dict[str, list] = {
        "entrance": [("forward", 4)],
        "room-a": [("turn_left", 2), ("forward", 4)],
        "room-b": [("forward", 4), ("turn_right", 2), ("forward", 4)],
        "room-c": [("forward", 4), ("turn_left", 2), ("forward", 4)],
    }

    def __init__(self, crawler: Optional[Any]):
        self.crawler = crawler

    def _do(self, action: str, steps: int, speed: int) -> None:
        if not self.crawler:
            return
        try:
            self.crawler.do_action(action, steps, speed)
        except Exception as e:
            print(f"[robot] gait error ({action} {steps}): {e}")

    def move_to_room(self, room_id: str, speed: int = 60) -> None:
        print(f"[robot] moving to {room_id}")
        if not self.crawler:
            time.sleep(1.0)
            return

        seq = self.ROOM_SEQ.get(room_id, [("forward", 4)])
        for action, steps in seq:
            self._do(action, steps, speed)
            time.sleep(0.2)

        # Sit briefly to stop sway before the camera scan.
        self._do("sit", 1, speed)
        time.sleep(0.3)

    def scan_room(self, room_id: str, speed: int = 60) -> None:
        print(f"[robot] scanning {room_id}")
        if not self.crawler:
            time.sleep(1.0)
            return

        # Small in-place sweep so the top-mounted camera covers the doorway.
        for action in ["turn_left", "turn_right", "turn_right", "turn_left"]:
            self._do(action, 1, speed)
            time.sleep(0.2)

    def return_to_base(self, speed: int = 60) -> None:
        print("[robot] returning to base")
        if not self.crawler:
            time.sleep(1.0)
            return

        # #TODO: replace with the actual reverse sequence for your arena.
        self._do("turn_left", 4, speed)
        self._do("forward", 8, speed)
        self._do("sit", 1, speed)

    def stop(self) -> None:
        print("[robot] stop")
        self._do("sit", 1, 60)


class MazeRunner:
    """
    Executes an open-loop maze path from the Operator /api/maze endpoint with
    optional ultrasonic safety stop.
    """

    def __init__(self, crawler: Optional[Any], ultrasonic: Optional[Any] = None):
        self.crawler = crawler
        self.ultrasonic = ultrasonic
        self.command_index = 0
        self.obstacle_detected = False

    def _do(self, action: str, steps: int, speed: int) -> None:
        if not self.crawler:
            return
        try:
            self.crawler.do_action(action, steps, speed)
        except Exception as e:
            print(f"[robot] maze gait error ({action} {steps}): {e}")

    def obstacle_near(self, threshold_cm: float = 15.0) -> bool:
        if not self.ultrasonic:
            return False
        try:
            dist = self.ultrasonic.read()
            return dist is not None and dist < threshold_cm
        except Exception as e:
            print(f"[robot] ultrasonic read error: {e}")
            return False

    def execute(self, payload: Dict[str, Any], speed: int = 60) -> None:
        action = payload.get("action")
        steps = int(payload.get("steps", 0))
        index = int(payload.get("index", 0))
        self.command_index = index
        self.obstacle_detected = False

        print(f"[robot] maze command #{index}: {action} {steps}")
        if not self.crawler:
            time.sleep(0.5)
            return

        if action in ("forward", "backward") and self.obstacle_near():
            print("[robot] obstacle ahead, pausing")
            self.obstacle_detected = True
            self._do("sit", 1, speed)
            return

        if action and steps > 0:
            self._do(action, steps, speed)
            time.sleep(0.2)
        elif action == "sit":
            self._do("sit", 1, speed)
            time.sleep(0.3)


class Detector:
    """
    #TODO: replace or calibrate for your target.

    Modes:
      none    - no autonomous detection; use the dashboard "Simulate Contact" button.
      opencv  - colour/blob detector for a printed target, red box, etc.
      imx500  - placeholder for Sony IMX500 AI camera; wire in your own script.
    """

    def __init__(self, method: str, camera_url: str, target_hsv: Tuple[Tuple[int, ...], Tuple[int, ...]]):
        self.method = method
        self.camera_url = camera_url
        self.target_hsv = target_hsv

    def detect(self) -> Optional[Dict[str, Any]]:
        if self.method == "none":
            return None
        if self.method == "imx500":
            return self._imx500_detect()
        if self.method == "opencv":
            return self._opencv_detect()
        return None

    def _opencv_detect(self) -> Optional[Dict[str, Any]]:
        if not HAS_CV2:
            return None

        cap: Optional[Any] = None
        try:
            cap = cv2.VideoCapture(self.camera_url if self.camera_url else 0)
            if not cap.isOpened():
                print("[detector] camera not open")
                return None

            ret, frame = cap.read()
            if not ret or frame is None:
                return None

            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            lower, upper = self.target_hsv
            mask = cv2.inRange(hsv, lower, upper)
            mask = cv2.erode(mask, None, iterations=2)
            mask = cv2.dilate(mask, None, iterations=2)

            contours, _ = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if not contours:
                return None

            biggest = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(biggest)
            if area < 500:  # #TODO: tune minimum target size in pixels
                return None

            x, y, w, h = cv2.boundingRect(biggest)
            confidence = min(0.99, area / 5000)  # #TODO: tune confidence scaling
            return {
                "label": "person",
                "confidence": round(confidence, 2),
                "bbox": [int(x), int(y), int(w), int(h)],
            }
        finally:
            if cap:
                cap.release()

    def _imx500_detect(self) -> Optional[Dict[str, Any]]:
        # #TODO: wire in your IMX500 demo script here.
        # Example: run `imx500_object_detection_demo.py --model ...`, parse stdout.
        return None


def send_telemetry(
    api: str,
    room_id: Optional[str],
    status: str,
    camera_url: str,
    detection: Optional[Dict[str, Any]] = None,
) -> None:
    payload: Dict[str, Any] = {
        "status": status,
        "battery": 87,
        "cameraUrl": camera_url,
    }
    if detection:
        payload["detection"] = {**detection, "roomId": room_id}
    try:
        requests.post(f"{api}/api/room-clearance/telemetry", json=payload, timeout=3)
    except requests.RequestException as e:
        print(f"[bridge] telemetry error: {e}")


def poll_command(api: str) -> Dict[str, Any]:
    try:
        res = requests.get(f"{api}/api/room-clearance/next-command", timeout=3)
        if res.status_code == 200:
            return res.json()
    except requests.RequestException as e:
        print(f"[bridge] poll error: {e}")
    return {"command": "none"}


def poll_maze_command(api: str) -> Dict[str, Any]:
    try:
        res = requests.get(f"{api}/api/maze/next-command", timeout=3)
        if res.status_code == 200:
            return res.json()
    except requests.RequestException as e:
        print(f"[bridge] maze poll error: {e}")
    return {"command": "none"}


def send_maze_telemetry(
    api: str,
    command_index: int,
    camera_url: str,
    obstacle_detected: bool,
    status: str,
) -> None:
    payload: Dict[str, Any] = {
        "status": status,
        "battery": 87,
        "cameraUrl": camera_url,
        "command_index": command_index,
        "obstacle_detected": obstacle_detected,
    }
    try:
        requests.post(f"{api}/api/maze/telemetry", json=payload, timeout=3)
    except requests.RequestException as e:
        print(f"[bridge] maze telemetry error: {e}")


def init_ultrasonic() -> Optional[Any]:
    if not HAS_ULTRASONIC:
        return None
    try:
        return Ultrasonic(Pin("D2"), Pin("D3"))
    except Exception as e:
        print(f"[bridge] ultrasonic init failed: {e}")
        return None


def parse_hsv(s: str) -> Tuple[int, ...]:
    return tuple(int(v) for v in s.split(","))


def main() -> None:
    parser = argparse.ArgumentParser(description="PiCrawler bridge for Operator room-clearance demo")
    parser.add_argument("--api", default=DEFAULT_API, help="Operator backend URL")
    parser.add_argument("--robot-id", default=ROBOT_ID, help="Robot identifier")
    parser.add_argument(
        "--camera-url",
        default=DEFAULT_CAMERA,
        help="MJPEG stream URL visible to the dashboard, e.g. http://<pi-ip>:8080/?action=stream",
    )
    parser.add_argument("--detect", choices=["none", "opencv", "imx500"], default="none", help="Detector mode")
    parser.add_argument("--target-hsv-lower", default="0,100,100", help="OpenCV HSV lower bound (H,S,V)")
    parser.add_argument("--target-hsv-upper", default="10,255,255", help="OpenCV HSV upper bound (H,S,V)")
    parser.add_argument("--speed", type=int, default=60, help="Gait speed for movements")
    args = parser.parse_args()

    crawler = init_robot()
    ultrasonic = init_ultrasonic()
    gait = GaitPlanner(crawler)
    maze = MazeRunner(crawler, ultrasonic)
    detector = Detector(
        args.detect,
        args.camera_url,
        (parse_hsv(args.target_hsv_lower), parse_hsv(args.target_hsv_upper)),
    )

    print(f"[bridge] {args.robot_id} started")
    print(f"[bridge] backend: {args.api}")
    print(f"[bridge] camera: {args.camera_url or 'none'}")
    print(f"[bridge] detector: {args.detect}")
    print(f"[bridge] picrawler: {'yes' if crawler else 'simulation'}")
    print(f"[bridge] ultrasonic: {'yes' if ultrasonic else 'none'}")

    current_room: Optional[str] = None
    heartbeat = 0

    while True:
        cmd = poll_command(args.api)
        command = cmd.get("command", "none")
        payload = cmd.get("payload", {})

        if command == "move_to_room":
            current_room = payload.get("roomId")
            gait.move_to_room(current_room, args.speed)
            send_telemetry(args.api, current_room, "moving", args.camera_url)

        elif command == "scan_room":
            current_room = payload.get("roomId")
            gait.scan_room(current_room, args.speed)
            detection = detector.detect()
            send_telemetry(args.api, current_room, "scanning", args.camera_url, detection)

        elif command == "return_to_base":
            gait.return_to_base(args.speed)
            current_room = None
            send_telemetry(args.api, None, "idle", args.camera_url)

        elif command == "stop":
            gait.stop()
            send_telemetry(args.api, current_room, "halted", args.camera_url)

        # Maze demo commands (independent of room-clearance flow).
        maze_cmd = poll_maze_command(args.api)
        maze_command = maze_cmd.get("command", "none")
        if maze_command == "execute_command":
            maze.execute(maze_cmd.get("payload", {}), args.speed)
            send_maze_telemetry(
                args.api,
                maze.command_index,
                args.camera_url,
                maze.obstacle_detected,
                "moving" if not maze.obstacle_detected else "paused",
            )
        elif maze_command == "stop":
            maze._do("sit", 1, args.speed)
            send_maze_telemetry(args.api, maze.command_index, args.camera_url, False, "halted")

        # Heartbeat so the dashboard always has camera URL / battery.
        heartbeat += 1
        if heartbeat % 10 == 0:
            send_telemetry(args.api, current_room, "idle" if command == "none" else "active", args.camera_url)

        time.sleep(0.5)


if __name__ == "__main__":
    main()
