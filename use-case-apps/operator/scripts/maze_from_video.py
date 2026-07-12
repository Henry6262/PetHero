#!/usr/bin/env python3
"""
Drone / phone video → binary maze grid for the PiCrawler demo.

Run on the laptop or on the Pi:
    python3 scripts/maze_from_video.py --input maze.mp4 --output maze_map.json

Recommended physical maze:
    - Light floor (or white poster board)
    - Black tape walls (about 2 cm wide)
    - Four corner markers so the script can perspective-correct the video:
        ArUco IDs 0-3 in the four corners, OR
        colored paper squares: blue, green, red, yellow (one in each corner)
    - Start marker: red square / ArUco ID 10
    - End marker: green square / ArUco ID 11

Output JSON:
    {
      "width": 32,
      "height": 32,
      "cell_size_m": 0.10,
      "grid": [[0,1,...], ...],  # 0=free, 1=wall
      "start": [2,30],
      "end": [30,2],
      "inflated_grid": [[0,1,...], ...],
      "origin_image": "maze_map_debug.jpg"
    }
"""
import argparse
import json
import math
import sys
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np

try:
    import cv2

    HAS_CV2 = True
except Exception as e:  # pragma: no cover - import guard
    print(f"[maze_from_video] opencv import failed: {e}")
    HAS_CV2 = False
    sys.exit(1)


ARUCO_CORNER_IDS = [0, 1, 2, 3]  # top-left, top-right, bottom-right, bottom-left
ARUCO_START_ID = 10
ARUCO_END_ID = 11


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Turn a top-down maze video into a grid map")
    parser.add_argument("--input", "-i", required=True, help="Video file or image file")
    parser.add_argument("--output", "-o", default="maze_map.json", help="Output JSON path")
    parser.add_argument("--debug", "-d", default="", help="Path to write debug visualization image")
    parser.add_argument("--cols", "-c", type=int, default=32, help="Grid columns")
    parser.add_argument("--rows", "-r", type=int, default=32, help="Grid rows")
    parser.add_argument(
        "--cell-size-m", type=float, default=0.10, help="Real-world cell size in meters"
    )
    parser.add_argument(
        "--robot-radius-m", type=float, default=0.08, help="Robot radius for wall inflation"
    )
    parser.add_argument(
        "--wall-color",
        choices=["dark", "light"],
        default="dark",
        help="Whether maze walls are darker or lighter than the floor",
    )
    parser.add_argument(
        "--marker-mode",
        choices=["aruco", "color", "none"],
        default="aruco",
        help="How to find maze corners and start/end markers",
    )
    parser.add_argument(
        "--color-start-hsv",
        default="0,120,70,10,255,255",
        help="HSV range for start marker (H_lo,S_lo,V_lo,H_hi,S_hi,V_hi)",
    )
    parser.add_argument(
        "--color-end-hsv",
        default="60,120,70,90,255,255",
        help="HSV range for end marker (H_lo,S_lo,V_lo,H_hi,S_hi,V_hi)",
    )
    parser.add_argument(
        "--color-corner-hsv",
        default="100,120,70,130,255,255",
        help="HSV range for corner markers (H_lo,S_lo,V_lo,H_hi,S_hi,V_hi)",
    )
    parser.add_argument(
        "--start-id", type=int, default=ARUCO_START_ID, help="ArUco ID used for start"
    )
    parser.add_argument(
        "--end-id", type=int, default=ARUCO_END_ID, help="ArUco ID used for end"
    )
    return parser.parse_args()


def parse_hsv6(s: str) -> Tuple[Tuple[int, int, int], Tuple[int, int, int]]:
    vals = [int(v) for v in s.split(",")]
    if len(vals) != 6:
        raise ValueError(f"HSV string must have 6 ints, got {s}")
    return (tuple(vals[:3]), tuple(vals[3:]))  # type: ignore[return-value]


def load_frame(path: str) -> np.ndarray:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        # Try as image.
        img = cv2.imread(path)
        if img is None:
            raise RuntimeError(f"Cannot open {path} as video or image")
        return img

    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    # Pick a middle frame for stability.
    target = max(0, total // 2)
    cap.set(cv2.CAP_PROP_POS_FRAMES, target)
    ret, frame = cap.read()
    cap.release()
    if not ret or frame is None:
        raise RuntimeError(f"Could not read frame from {path}")
    return frame


def detect_aruco_markers(frame: np.ndarray) -> Tuple[dict, np.ndarray]:
    """Return {id: center_point} and the marker visualization image."""
    corners: dict = {}
    debug = frame.copy()
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    params = cv2.aruco.DetectorParameters()
    detector = cv2.aruco.ArucoDetector(aruco_dict, params)
    marker_corners, marker_ids, _ = detector.detectMarkers(frame)
    if marker_ids is not None:
        cv2.aruco.drawDetectedMarkers(debug, marker_corners, marker_ids)
        for cid, pts in zip(marker_ids.flatten(), marker_corners):
            center = pts[0].mean(axis=0).astype(int)
            corners[int(cid)] = tuple(center)
    return corners, debug


def detect_color_marker(frame: np.ndarray, lower: Tuple[int, ...], upper: Tuple[int, ...]) -> Optional[Tuple[int, int]]:
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8), iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=2)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    biggest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(biggest)
    if area < 100:
        return None
    moments = cv2.moments(biggest)
    if moments["m00"] == 0:
        return None
    cx = int(moments["m10"] / moments["m00"])
    cy = int(moments["m01"] / moments["m00"])
    return (cx, cy)


def order_points(pts: np.ndarray) -> np.ndarray:
    """Order four points top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def find_corners(frame: np.ndarray, mode: str, corner_hsv: Tuple[Tuple[int, ...], Tuple[int, ...]]) -> Optional[np.ndarray]:
    """Return ordered corner points (4x2) or None."""
    h, w = frame.shape[:2]
    if mode == "none":
        return np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]], dtype=np.float32)

    if mode == "aruco":
        markers, _ = detect_aruco_markers(frame)
        found = {cid: markers.get(cid) for cid in ARUCO_CORNER_IDS}
        if all(found.values()):
            pts = np.array([found[i] for i in ARUCO_CORNER_IDS], dtype=np.float32)
            return order_points(pts)
        return None

    if mode == "color":
        lower, upper = corner_hsv
        # Detect one big blob; assume the four largest are corners? Simpler: use image center
        # as reference and pick four largest color blobs sorted by quadrant.
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8), iterations=2)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if len(contours) < 4:
            return None
        centers = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 100:
                continue
            M = cv2.moments(cnt)
            if M["m00"] == 0:
                continue
            centers.append((area, (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))))
        if len(centers) < 4:
            return None
        centers.sort(reverse=True, key=lambda x: x[0])
        pts = np.array([c[1] for _, c in centers[:4]], dtype=np.float32)
        return order_points(pts)

    return None


def perspective_correct(frame: np.ndarray, corners: np.ndarray, out_size: int = 800) -> np.ndarray:
    dst = np.array(
        [[0, 0], [out_size - 1, 0], [out_size - 1, out_size - 1], [0, out_size - 1]],
        dtype=np.float32,
    )
    M = cv2.getPerspectiveTransform(corners, dst)
    return cv2.warpPerspective(frame, M, (out_size, out_size))


def extract_grid(
    top_down: np.ndarray,
    rows: int,
    cols: int,
    wall_color: str,
    robot_radius_m: float,
    cell_size_m: float,
) -> Tuple[np.ndarray, np.ndarray]:
    """Return binary grid (rows x cols) and inflated grid. 0=free, 1=wall."""
    gray = cv2.cvtColor(top_down, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    # Adaptive threshold works for both dark and light walls.
    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 5)
    if wall_color == "dark":
        binary = cv2.bitwise_not(binary)

    # Clean noise.
    kernel = np.ones((5, 5), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)

    # Downsample to grid.
    small = cv2.resize(binary, (cols, rows), interpolation=cv2.INTER_AREA)
    grid = (small > 127).astype(np.uint8)

    # Inflate walls by robot radius.
    inflate_cells = max(1, int(math.ceil(robot_radius_m / cell_size_m)))
    if inflate_cells > 0:
        wall_mask = (grid == 1).astype(np.uint8) * 255
        big_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (inflate_cells * 2 + 1, inflate_cells * 2 + 1))
        inflated = cv2.dilate(wall_mask, big_kernel, iterations=1)
        inflated_grid = (inflated > 127).astype(np.uint8)
    else:
        inflated_grid = grid.copy()

    return grid, inflated_grid


def find_marker_cell(
    top_down: np.ndarray,
    marker_mode: str,
    start_hsv: Tuple[Tuple[int, ...], Tuple[int, ...]],
    end_hsv: Tuple[Tuple[int, ...], Tuple[int, ...]],
    aruco_start_id: int,
    aruco_end_id: int,
    rows: int,
    cols: int,
) -> Tuple[Optional[Tuple[int, int]], Optional[Tuple[int, int]]]:
    """Return (start_cell, end_cell) in grid coordinates (row, col)."""
    h, w = top_down.shape[:2]
    start_pt: Optional[Tuple[int, int]] = None
    end_pt: Optional[Tuple[int, int]] = None

    if marker_mode == "aruco":
        markers, _ = detect_aruco_markers(top_down)
        if aruco_start_id in markers:
            start_pt = markers[aruco_start_id]
        if aruco_end_id in markers:
            end_pt = markers[aruco_end_id]
    elif marker_mode == "color":
        start_pt = detect_color_marker(top_down, *start_hsv)
        end_pt = detect_color_marker(top_down, *end_hsv)

    def to_cell(pt: Optional[Tuple[int, int]]) -> Optional[Tuple[int, int]]:
        if pt is None:
            return None
        col = int(np.clip(pt[0] / w * cols, 0, cols - 1))
        row = int(np.clip(pt[1] / h * rows, 0, rows - 1))
        return (row, col)

    return to_cell(start_pt), to_cell(end_pt)


def draw_debug(
    top_down: np.ndarray,
    grid: np.ndarray,
    start: Optional[Tuple[int, int]],
    end: Optional[Tuple[int, int]],
) -> np.ndarray:
    h, w = top_down.shape[:2]
    rows, cols = grid.shape
    cell_h, cell_w = h / rows, w / cols
    overlay = top_down.copy()
    for r in range(rows):
        for c in range(cols):
            x1, y1 = int(c * cell_w), int(r * cell_h)
            x2, y2 = int((c + 1) * cell_w), int((r + 1) * cell_h)
            if grid[r, c] == 1:
                cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 0, 0), -1)
            cv2.rectangle(overlay, (x1, y1), (x2, y2), (200, 200, 200), 1)
    if start:
        y, x = start
        cv2.circle(
            overlay,
            (int((x + 0.5) * cell_w), int((y + 0.5) * cell_h)),
            max(5, int(min(cell_w, cell_h) * 0.4)),
            (0, 0, 255),
            -1,
        )
    if end:
        y, x = end
        cv2.circle(
            overlay,
            (int((x + 0.5) * cell_w), int((y + 0.5) * cell_h)),
            max(5, int(min(cell_w, cell_h) * 0.4)),
            (0, 255, 0),
            -1,
        )
    return overlay


def main() -> None:
    args = parse_args()
    if not HAS_CV2:
        sys.exit(1)

    print(f"[maze_from_video] loading {args.input}")
    frame = load_frame(args.input)

    start_hsv = parse_hsv6(args.color_start_hsv)
    end_hsv = parse_hsv6(args.color_end_hsv)
    corner_hsv = parse_hsv6(args.color_corner_hsv)

    corners = find_corners(frame, args.marker_mode, corner_hsv)
    if corners is None:
        print(
            "[maze_from_video] WARNING: could not find corners; using full frame. "
            "Use --marker-mode none or place visible corner markers.",
            file=sys.stderr,
        )
        h, w = frame.shape[:2]
        size = min(h, w)
        corners = np.array(
            [[0, 0], [size - 1, 0], [size - 1, size - 1], [0, size - 1]], dtype=np.float32
        )

    print("[maze_from_video] perspective correcting")
    top_down = perspective_correct(frame, corners, out_size=800)

    print(f"[maze_from_video] extracting {args.cols}x{args.rows} grid")
    grid, inflated_grid = extract_grid(
        top_down,
        args.rows,
        args.cols,
        args.wall_color,
        args.robot_radius_m,
        args.cell_size_m,
    )

    print("[maze_from_video] locating start/end markers")
    start, end = find_marker_cell(
        top_down,
        args.marker_mode,
        start_hsv,
        end_hsv,
        args.start_id,
        args.end_id,
        args.rows,
        args.cols,
    )

    # Fallback positions if markers not found.
    if start is None:
        start = (args.rows - 2, 1)
        print("[maze_from_video] start marker not found, using fallback", file=sys.stderr)
    if end is None:
        end = (1, args.cols - 2)
        print("[maze_from_video] end marker not found, using fallback", file=sys.stderr)

    # Ensure start/end are free.
    for label, cell in [("start", start), ("end", end)]:
        if inflated_grid[cell[0], cell[1]] == 1:
            print(f"[maze_from_video] WARNING: {label} cell is inside a wall", file=sys.stderr)

    result = {
        "width": args.cols,
        "height": args.rows,
        "cell_size_m": args.cell_size_m,
        "robot_radius_m": args.robot_radius_m,
        "grid": grid.tolist(),
        "inflated_grid": inflated_grid.tolist(),
        "start": list(start),
        "end": list(end),
        "debug_image": "",
    }

    if args.debug:
        debug_img = draw_debug(top_down, grid, start, end)
        cv2.imwrite(args.debug, debug_img)
        result["debug_image"] = str(Path(args.debug).resolve())
        print(f"[maze_from_video] wrote debug image {args.debug}")

    with open(args.output, "w") as f:
        json.dump(result, f, indent=2)
    print(f"[maze_from_video] wrote {args.output}")


if __name__ == "__main__":
    main()
