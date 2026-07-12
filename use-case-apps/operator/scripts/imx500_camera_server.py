#!/usr/bin/env python3
"""
IMX500 AI camera server for the Operator room-clearance demo.

Runs on the Raspberry Pi 5 with the Raspberry Pi AI Camera (Sony IMX500).
It does two things at once:

1. Serves an MJPEG stream with object-detection overlays so the dashboard
   video box can show the robot's camera feed.
2. Watches for "person" detections and POSTs them to the Operator backend
   as room-clearance telemetry contacts.

Install on the Pi first:
    sudo apt update && sudo apt full-upgrade -y
    sudo apt install imx500-all python3-opencv python3-munkres
    sudo reboot

Then run:
    OPERATOR_API=http://<laptop-ip>:3069 \
        python3 scripts/imx500_camera_server.py

The dashboard camera URL is then:
    http://<pi-ip>:8080/
"""
import argparse
import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Optional

import requests

try:
    import cv2
    from picamera2 import MappedArray, Picamera2
    from picamera2.devices import IMX500
    from picamera2.devices.imx500 import NetworkIntrinsics, postprocess_nanodet_detection

    HAS_PICAMERA = True
except Exception as e:
    HAS_PICAMERA = False
    print(f"[camera] failed to import picamera2/imx500: {e}")
    sys.exit(1)

DEFAULT_API = os.environ.get("OPERATOR_API", "http://localhost:3069")
DEFAULT_MODEL = "/usr/share/imx500-models/imx500_network_ssd_mobilenetv2_fpnlite_320x320_pp.rpk"
DEFAULT_PORT = 8080

# Shared MJPEG frame buffer
_latest_frame: Optional[bytes] = None
_frame_lock = threading.Lock()

# Throttle detection telemetry so we don't spam the backend.
_last_detection_time = 0.0
_DETECTION_COOLDOWN = 1.0

# COCO-SSD class names (fallback if the model does not embed labels).
_COCO_LABELS = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote",
    "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book",
    "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush",
]

args: argparse.Namespace
imx500: IMX500
picam2: Picamera2
intrinsics: NetworkIntrinsics
last_results = []


class Detection:
    def __init__(self, coords, category, conf, metadata):
        self.category = category
        self.conf = conf
        self.box = imx500.convert_inference_coords(coords, metadata, picam2)


def parse_detections(metadata: dict):
    """Parse the IMX500 output tensor into detections."""
    global last_results

    np_outputs = imx500.get_outputs(metadata, add_batch=True)
    input_w, input_h = imx500.get_input_size()
    if np_outputs is None:
        return last_results

    if intrinsics.postprocess == "nanodet":
        boxes, scores, classes = postprocess_nanodet_detection(
            outputs=np_outputs[0],
            conf=args.threshold,
            iou_thres=args.iou,
            max_out_dets=args.max_detections,
        )[0]
        from picamera2.devices.imx500.postprocess import scale_boxes

        boxes = scale_boxes(boxes, 1, 1, input_h, input_w, False, False)
    else:
        boxes, scores, classes = np_outputs[0][0], np_outputs[1][0], np_outputs[2][0]
        if intrinsics.bbox_normalization:
            boxes = boxes / input_h
        if intrinsics.bbox_order == "xy":
            boxes = boxes[:, [1, 0, 3, 2]]

    last_results = [
        Detection(box, int(category), float(score), metadata)
        for box, score, category in zip(boxes, scores, classes)
        if float(score) > args.threshold
    ]
    return last_results


def get_labels():
    labels = intrinsics.labels
    if labels is None:
        labels = _COCO_LABELS
    if intrinsics.ignore_dash_labels:
        labels = [label for label in labels if label and label != "-"]
    return labels


def post_detection(label: str, confidence: float):
    """Tell the Operator backend that a target was seen."""
    global _last_detection_time

    now = time.time()
    if now - _last_detection_time < _DETECTION_COOLDOWN:
        return
    _last_detection_time = now

    payload = {
        "status": "scanning",
        "battery": 87,
        "cameraUrl": f"http://{get_pi_ip()}:{args.port}/",
        "detection": {
            "label": label,
            "confidence": round(confidence, 2),
        },
    }
    try:
        requests.post(f"{args.api}/api/room-clearance/telemetry", json=payload, timeout=3)
        print(f"[camera] sent {label} contact, confidence {confidence:.2f}")
    except requests.RequestException as e:
        print(f"[camera] telemetry error: {e}")


def get_pi_ip() -> str:
    """Best-effort local IP for the camera URL."""
    import socket

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def draw_detections(request, stream="main"):
    """Draw boxes on the frame, encode it for the MJPEG stream, and post contacts."""
    detections = last_results
    labels = get_labels()

    with MappedArray(request, stream) as m:
        if detections:
            for detection in detections:
                x, y, w, h = detection.box
                label = f"{labels[int(detection.category)]} ({detection.conf:.2f})"

                (text_width, text_height), baseline = cv2.getTextSize(
                    label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
                )
                overlay = m.array.copy()
                cv2.rectangle(
                    overlay,
                    (x + 5, y + 15 - text_height),
                    (x + 5 + text_width, y + 15 + baseline),
                    (255, 255, 255),
                    cv2.FILLED,
                )
                cv2.addWeighted(overlay, 0.30, m.array, 0.70, 0, m.array)
                cv2.putText(m.array, label, (x + 5, y + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                cv2.rectangle(m.array, (x, y), (x + w, y + h), (0, 255, 0), 2)

            # If we saw a person, notify the C2 backend.
            for detection in detections:
                if labels[int(detection.category)].lower() == "person":
                    post_detection("person", detection.conf)

        if intrinsics.preserve_aspect_ratio:
            b_x, b_y, b_w, b_h = imx500.get_roi_scaled(request)
            cv2.putText(m.array, "ROI", (b_x + 5, b_y + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)
            cv2.rectangle(m.array, (b_x, b_y), (b_x + b_w, b_y + b_h), (255, 0, 0), 1)

        # Encode and publish the frame.
        ret, jpeg = cv2.imencode(".jpg", m.array)
        if ret:
            with _frame_lock:
                global _latest_frame
                _latest_frame = jpeg.tobytes()


class MJPEGHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        try:
            while True:
                with _frame_lock:
                    frame = _latest_frame
                if frame:
                    self.wfile.write(b"--frame\r\n")
                    self.send_header("Content-Type", "image/jpeg")
                    self.send_header("Content-Length", str(len(frame)))
                    self.end_headers()
                    self.wfile.write(frame)
                    self.wfile.write(b"\r\n")
                time.sleep(0.066)  # ~15 fps
        except BrokenPipeError:
            pass

    def log_message(self, format, *args):
        pass


def parse_hsv(s: str):
    return tuple(int(v) for v in s.split(","))


def run_color_detection():
    """OpenCV colour-blob fallback when person detection is not suitable."""
    if args.mode != "color":
        return
    try:
        frame = picam2.capture_array()
        hsv = cv2.cvtColor(frame, cv2.COLOR_RGB2HSV)
        lower = parse_hsv(args.lower_hsv)
        upper = parse_hsv(args.upper_hsv)
        mask = cv2.inRange(hsv, lower, upper)
        mask = cv2.erode(mask, None, iterations=2)
        mask = cv2.dilate(mask, None, iterations=2)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return

        biggest = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(biggest)
        if area < args.min_area:
            return

        confidence = min(0.99, area / 5000)
        post_detection("target", confidence)
    except Exception as e:
        print(f"[camera] color detection error: {e}")


def camera_loop():
    """Continuously pull metadata so the pre_callback fires with fresh detections."""
    while True:
        metadata = picam2.capture_metadata()
        parse_detections(metadata)
        run_color_detection()


def main():
    global args, imx500, picam2, intrinsics

    parser = argparse.ArgumentParser(description="IMX500 AI camera server for Operator")
    parser.add_argument("--api", default=DEFAULT_API, help="Operator backend URL")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="MJPEG server port")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Path to .rpk model")
    parser.add_argument("--threshold", type=float, default=0.55, help="Detection threshold")
    parser.add_argument("--iou", type=float, default=0.65, help="NMS IoU threshold")
    parser.add_argument("--max-detections", type=int, default=10)
    parser.add_argument("--ignore-dash-labels", action="store_true", default=True)
    parser.add_argument("--postprocess", choices=["", "nanodet"], default=None)
    parser.add_argument("--preserve-aspect-ratio", action="store_true", default=False)
    parser.add_argument("--fps", type=int, default=15, help="Stream/output FPS")
    parser.add_argument("--mode", choices=["person", "color"], default="person",
                        help="Detection mode: person class (IMX500) or colored blob (OpenCV)")
    parser.add_argument("--lower-hsv", default="0,100,100",
                        help="HSV lower bound for color mode (H,S,V)")
    parser.add_argument("--upper-hsv", default="10,255,255",
                        help="HSV upper bound for color mode (H,S,V)")
    parser.add_argument("--min-area", type=int, default=500,
                        help="Minimum contour area in pixels for color mode")
    args = parser.parse_args()

    # Initialise IMX500 before Picamera2.
    imx500 = IMX500(args.model)
    intrinsics = imx500.network_intrinsics
    if intrinsics is None:
        intrinsics = NetworkIntrinsics()
        intrinsics.task = "object detection"
    elif intrinsics.task != "object detection":
        print("[camera] model is not an object-detection network", file=sys.stderr)
        sys.exit(1)

    # Apply args to intrinsics.
    for key, value in vars(args).items():
        if hasattr(intrinsics, key) and value is not None:
            setattr(intrinsics, key, value)
    if intrinsics.labels is None:
        intrinsics.labels = _COCO_LABELS
    intrinsics.update_with_defaults()

    picam2 = Picamera2(imx500.camera_num)
    config = picam2.create_preview_configuration(
        main={"size": (640, 480)},
        controls={"FrameRate": args.fps},
        buffer_count=12,
    )

    imx500.show_network_fw_progress_bar()
    picam2.start(config, show_preview=False)

    if intrinsics.preserve_aspect_ratio:
        imx500.set_auto_aspect_ratio()

    picam2.pre_callback = draw_detections

    # Start the metadata loop in a background thread.
    threading.Thread(target=camera_loop, daemon=True).start()

    # Start the MJPEG server.
    server = HTTPServer(("0.0.0.0", args.port), MJPEGHandler)
    ip = get_pi_ip()
    print(f"[camera] AI Camera server running")
    print(f"[camera] mode: {args.mode}")
    if args.mode == "color":
        print(f"[camera] HSV range: {args.lower_hsv} -> {args.upper_hsv}, min area {args.min_area}px")
    print(f"[camera] MJPEG stream: http://{ip}:{args.port}/")
    print(f"[camera] Operator backend: {args.api}")
    print(f"[camera] Use CAMERA_URL=http://{ip}:{args.port}/ in the PiCrawler bridge")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[camera] shutting down")
    finally:
        picam2.stop()


if __name__ == "__main__":
    main()
