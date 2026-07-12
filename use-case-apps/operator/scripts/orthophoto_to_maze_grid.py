#!/usr/bin/env python3
"""
Orthophoto (WebODM / top-down image) → binary maze grid for Operator / PiCrawler.

The orthophoto is already top-down and scaled, so this script just needs to:
  1. Segment colored crates from the floor.
  2. Rasterize them into a grid.
  3. Inflate walls by the robot radius.
  4. Mark the outer unknown area as wall.

Usage:
    python3 scripts/orthophoto_to_maze_grid.py \
        --input orthophoto.png \
        --output maze_map.json \
        --debug maze_debug.jpg \
        --px-per-m 55.0 \
        --physical-size-m 3.0 \
        --cell-size-m 0.05 \
        --robot-radius-m 0.08

If you do not know px-per-m, measure one known object in the orthophoto:
    px-per-m = width_in_pixels / width_in_meters
"""
import argparse
import json
import math
import sys
from pathlib import Path
from typing import Tuple

import numpy as np

try:
    import cv2

    HAS_CV2 = True
except Exception as e:
    print(f"[orthophoto_to_maze_grid] opencv import failed: {e}")
    HAS_CV2 = False
    sys.exit(1)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert a scaled top-down orthophoto into a maze grid")
    parser.add_argument("--input", "-i", required=True, help="Orthophoto image path (PNG/JPG/TIF)")
    parser.add_argument("--output", "-o", default="maze_map.json", help="Output JSON path")
    parser.add_argument("--debug", "-d", default="", help="Path to write debug visualization image")
    parser.add_argument("--px-per-m", type=float, required=True, help="Image pixels per real-world meter")
    parser.add_argument("--physical-size-m", type=float, default=3.0, help="Output arena width/height in meters")
    parser.add_argument("--cell-size-m", type=float, default=0.05, help="Grid cell size in meters")
    parser.add_argument("--robot-radius-m", type=float, default=0.08, help="Robot radius for wall inflation")
    parser.add_argument("--sat-threshold", type=int, default=35, help="HSV saturation threshold for colored crates")
    parser.add_argument("--value-min", type=int, default=40, help="Minimum V channel value")
    parser.add_argument("--value-max", type=int, default=250, help="Maximum V channel value")
    parser.add_argument("--morph-kernel", type=int, default=5, help="Morphological kernel size")
    parser.add_argument("--min-crate-area-px", type=int, default=200, help="Minimum crate component area")
    parser.add_argument("--max-crate-area-px", type=int, default=200000, help="Maximum crate component area")
    parser.add_argument("--boundary-dilate-m", type=float, default=0.15, help="Dilate outer boundary by meters")
    parser.add_argument("--wall-threshold", type=float, default=0.25, help="Occupancy fraction to mark wall")
    parser.add_argument("--start-cell", default="auto", help="Start cell 'row,col' or 'auto' (bottom centre)")
    parser.add_argument("--end-cell", default="auto", help="End cell 'row,col' or 'auto' (centre)")
    parser.add_argument("--crop-center", action="store_true", help="Crop image to physical-size-m square around image centre")
    return parser.parse_args()


def detect_crate_mask(
    frame: np.ndarray,
    sat_threshold: int,
    value_min: int,
    value_max: int,
    morph_kernel: int,
    min_area_px: int,
    max_area_px: int,
) -> np.ndarray:
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    sat = hsv[:, :, 1]
    val = hsv[:, :, 2]
    mask = ((sat > sat_threshold) & (val > value_min) & (val < value_max)).astype(np.uint8) * 255

    kernel = np.ones((morph_kernel, morph_kernel), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    cleaned = np.zeros_like(mask)
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if min_area_px <= area <= max_area_px:
            cleaned[labels == i] = 255
    return cleaned


def find_nearest_free(grid: np.ndarray, target: Tuple[int, int]) -> Tuple[int, int]:
    rows, cols = grid.shape
    tr, tc = target
    if 0 <= tr < rows and 0 <= tc < cols and grid[tr, tc] == 0:
        return target
    best = target
    best_d = math.inf
    for r in range(rows):
        for c in range(cols):
            if grid[r, c] == 0:
                d = abs(r - tr) + abs(c - tc)
                if d < best_d:
                    best_d = d
                    best = (r, c)
    return best


def parse_cell(s: str, default: Tuple[int, int]) -> Tuple[int, int]:
    if s == "auto":
        return default
    parts = [int(v) for v in s.split(",")]
    if len(parts) != 2:
        raise ValueError(f"Cell must be 'row,col', got {s}")
    return (parts[0], parts[1])


def main() -> None:
    args = parse_args()

    frame = cv2.imread(str(args.input))
    if frame is None:
        print(f"[orthophoto_to_maze_grid] ERROR: cannot load {args.input}", file=sys.stderr)
        sys.exit(1)
    print(f"[orthophoto_to_maze_grid] loaded {args.input} {frame.shape}, {args.px_per_m:.1f} px/m")

    if args.crop_center:
        crop_px = int(round(args.physical_size_m * args.px_per_m))
        h, w = frame.shape[:2]
        cx, cy = w // 2, h // 2
        x1 = max(0, cx - crop_px // 2)
        y1 = max(0, cy - crop_px // 2)
        x2 = min(w, x1 + crop_px)
        y2 = min(h, y1 + crop_px)
        frame = frame[y1:y2, x1:x2]
        print(f"[orthophoto_to_maze_grid] cropped to {frame.shape}")

    mask = detect_crate_mask(
        frame,
        args.sat_threshold,
        args.value_min,
        args.value_max,
        args.morph_kernel,
        args.min_crate_area_px,
        args.max_crate_area_px,
    )

    grid_cols = int(round(args.physical_size_m / args.cell_size_m))
    grid_rows = grid_cols
    cell_px = args.cell_size_m * args.px_per_m
    print(f"[orthophoto_to_maze_grid] grid {grid_cols}x{grid_rows}, cell {cell_px:.1f}px")

    h, w = frame.shape[:2]
    grid = np.zeros((grid_rows, grid_cols), dtype=np.uint8)
    counts = np.zeros((grid_rows, grid_cols), dtype=np.float32)

    ys, xs = np.where(mask > 127)
    for y, x in zip(ys, xs):
        c = int(x / cell_px)
        r = int(y / cell_px)
        if 0 <= r < grid_rows and 0 <= c < grid_cols:
            grid[r, c] += 1
            counts[r, c] += 1

    # Normalize and threshold.
    nonzero = counts > 0
    grid = grid.astype(np.float32)
    grid[nonzero] /= counts[nonzero]
    grid = (grid > args.wall_threshold).astype(np.uint8)

    # Mark outside the crate convex hull as wall (unknown = unsafe).
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        all_pts = np.vstack(contours).reshape(-1, 2)
        hull = cv2.convexHull(all_pts)
        hull_mask = np.zeros_like(mask)
        cv2.fillConvexPoly(hull_mask, hull, 255)
        dilate_px = int(round(args.boundary_dilate_m * args.px_per_m))
        if dilate_px > 0:
            hull_mask = cv2.dilate(hull_mask, np.ones((dilate_px, dilate_px), np.uint8), iterations=1)
        occ_hull = np.zeros((grid_rows, grid_cols), dtype=np.float32)
        counts_hull = np.zeros((grid_rows, grid_cols), dtype=np.float32)
        ys, xs = np.where(hull_mask > 127)
        for y, x in zip(ys, xs):
            c = int(x / cell_px)
            r = int(y / cell_px)
            if 0 <= r < grid_rows and 0 <= c < grid_cols:
                occ_hull[r, c] += 1
                counts_hull[r, c] += 1
        nonzero_hull = counts_hull > 0
        occ_hull[nonzero_hull] /= counts_hull[nonzero_hull]
        outside = occ_hull < 0.25
        grid[outside] = 1

    # Inflate walls by robot radius.
    inflate_cells = max(1, int(math.ceil(args.robot_radius_m / args.cell_size_m)))
    wall_mask = (grid == 1).astype(np.uint8) * 255
    big_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (inflate_cells * 2 + 1, inflate_cells * 2 + 1))
    inflated = cv2.dilate(wall_mask, big_kernel, iterations=1)
    inflated_grid = (inflated > 127).astype(np.uint8)

    # Start / end cells.
    start_default = find_nearest_free(inflated_grid, (grid_rows - 2, grid_cols // 2))
    end_default = find_nearest_free(inflated_grid, (grid_rows // 2, grid_cols // 2))
    start = find_nearest_free(inflated_grid, parse_cell(args.start_cell, start_default))
    end = find_nearest_free(inflated_grid, parse_cell(args.end_cell, end_default))

    result = {
        "width": grid_cols,
        "height": grid_rows,
        "cell_size_m": args.cell_size_m,
        "robot_radius_m": args.robot_radius_m,
        "grid": grid.tolist(),
        "inflated_grid": inflated_grid.tolist(),
        "start": list(start),
        "end": list(end),
        "debug_image": "",
    }

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    if args.debug:
        cell_h, cell_w = h / grid_rows, w / grid_cols
        debug = frame.copy()
        overlay = np.zeros_like(debug)
        for r in range(grid_rows):
            for c in range(grid_cols):
                x1, y1 = int(c * cell_w), int(r * cell_h)
                x2, y2 = int((c + 1) * cell_w), int((r + 1) * cell_h)
                if inflated_grid[r, c] == 1:
                    cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 0, 200), -1)
                cv2.rectangle(debug, (x1, y1), (x2, y2), (200, 200, 200), 1)
        debug = cv2.addWeighted(debug, 1.0, overlay, 0.5, 0)
        if start:
            y, x = start
            cv2.circle(debug, (int((x + 0.5) * cell_w), int((y + 0.5) * cell_h)), max(8, int(min(cell_w, cell_h) * 0.5)), (0, 0, 255), -1)
        if end:
            y, x = end
            cv2.circle(debug, (int((x + 0.5) * cell_w), int((y + 0.5) * cell_h)), max(8, int(min(cell_w, cell_h) * 0.5)), (0, 255, 0), -1)
        cv2.imwrite(str(args.debug), debug)
        result["debug_image"] = str(Path(args.debug).resolve())
        print(f"[orthophoto_to_maze_grid] wrote debug image {args.debug}")

    with open(args.output, "w") as f:
        json.dump(result, f, indent=2)
    print(f"[orthophoto_to_maze_grid] wrote {args.output}")


if __name__ == "__main__":
    main()
