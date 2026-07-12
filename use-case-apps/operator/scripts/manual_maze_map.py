#!/usr/bin/env python3
"""
Manual crate maze map generator.

Use this when you have exact measurements of the maze and want a reliable grid
without depending on computer vision. You describe the outer crate circle as a
list of axis-aligned rectangles and any internal obstacles, and the script
rasterizes them into the same JSON format used by maze_solver.py and the
Operator backend.

Example for a 3 m × 3 m circular crate maze:

    python3 scripts/manual_maze_map.py \
        --width 3.0 --height 3.0 --cell-size 0.05 --robot-radius 0.08 \
        --crate 0.20,1.10,0.60,0.36 \
        --crate 0.55,0.85,0.60,0.36 \
        --crate 0.95,0.75,0.60,0.36 \
        --crate 1.45,0.80,0.60,0.36 \
        --crate 1.90,0.95,0.60,0.36 \
        --crate 2.25,1.25,0.60,0.36 \
        --crate 2.45,1.65,0.60,0.36 \
        --crate 2.40,2.10,0.60,0.36 \
        --crate 2.10,2.45,0.60,0.36 \
        --crate 1.65,2.55,0.60,0.36 \
        --crate 1.15,2.50,0.60,0.36 \
        --crate 0.70,2.30,0.60,0.36 \
        --crate 0.40,1.95,0.60,0.36 \
        --crate 0.25,1.55,0.60,0.36 \
        --obstacle 1.35,1.35,0.30,0.24 \
        --obstacle 1.65,1.65,0.24,0.30 \
        --start 1.50,0.30 --end 1.50,1.50 \
        --output results/maze_extraction/manual_bottle_maze.json \
        --debug results/maze_extraction/manual_bottle_maze_debug.jpg

Coordinates are in meters from the bottom-left corner of the arena.
Each --crate/--obstacle is "center_x,center_y,width,height".
"""
import argparse
import json
import math
import sys
from pathlib import Path
from typing import List, Tuple

import numpy as np

try:
    import cv2

    HAS_CV2 = True
except Exception as e:
    print(f"[manual_maze_map] opencv import failed: {e}")
    HAS_CV2 = False
    sys.exit(1)


def parse_rect(s: str) -> Tuple[float, float, float, float]:
    parts = [float(v) for v in s.split(",")]
    if len(parts) != 4:
        raise ValueError(f"Rectangle must be 'cx,cy,w,h', got {s}")
    return tuple(parts)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a maze map from manual measurements")
    parser.add_argument("--output", "-o", default="manual_maze_map.json", help="Output JSON path")
    parser.add_argument("--debug", "-d", default="", help="Path to write debug PNG")
    parser.add_argument("--width", type=float, default=3.0, help="Arena width in meters")
    parser.add_argument("--height", type=float, default=3.0, help="Arena height in meters")
    parser.add_argument("--cell-size", type=float, default=0.05, help="Grid cell size in meters")
    parser.add_argument("--robot-radius", type=float, default=0.08, help="Robot radius for wall inflation")
    parser.add_argument("--crate", action="append", default=[], help="Outer crate rectangle as cx,cy,w,h (meters)")
    parser.add_argument("--obstacle", action="append", default=[], help="Inner obstacle rectangle as cx,cy,w,h (meters)")
    parser.add_argument("--start", default="auto", help="Start point as x,y or 'auto' (bottom center)")
    parser.add_argument("--end", default="auto", help="End/target point as x,y or 'auto' (center)")
    return parser.parse_args()


def rasterize_rects(grid: np.ndarray, rects: List[Tuple[float, float, float, float]], cell_size: float, value: int) -> None:
    rows, cols = grid.shape
    for cx, cy, w, h in rects:
        x1 = cx - w / 2
        x2 = cx + w / 2
        y1 = cy - h / 2
        y2 = cy + h / 2
        c1 = max(0, int(x1 / cell_size))
        c2 = min(cols - 1, int(x2 / cell_size))
        r1 = max(0, int(y1 / cell_size))
        r2 = min(rows - 1, int(y2 / cell_size))
        grid[r1 : r2 + 1, c1 : c2 + 1] = value


def parse_point(s: str, default: Tuple[float, float]) -> Tuple[float, float]:
    if s == "auto":
        return default
    parts = [float(v) for v in s.split(",")]
    if len(parts) != 2:
        raise ValueError(f"Point must be 'x,y', got {s}")
    return (parts[0], parts[1])


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


def main() -> None:
    args = parse_args()

    cols = int(round(args.width / args.cell_size))
    rows = int(round(args.height / args.cell_size))
    grid = np.zeros((rows, cols), dtype=np.uint8)

    crates = [parse_rect(r) for r in args.crate]
    obstacles = [parse_rect(r) for r in args.obstacle]

    rasterize_rects(grid, crates, args.cell_size, 1)
    rasterize_rects(grid, obstacles, args.cell_size, 1)

    # Inflate walls by robot radius.
    inflate_cells = max(1, int(math.ceil(args.robot_radius / args.cell_size)))
    wall_mask = (grid == 1).astype(np.uint8) * 255
    big_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (inflate_cells * 2 + 1, inflate_cells * 2 + 1))
    inflated = cv2.dilate(wall_mask, big_kernel, iterations=1)
    inflated_grid = (inflated > 127).astype(np.uint8)

    # Start / end.
    start_default = (args.width / 2, args.height * 0.1)
    end_default = (args.width / 2, args.height / 2)
    sx, sy = parse_point(args.start, start_default)
    ex, ey = parse_point(args.end, end_default)

    # Convert meters (bottom-left origin) to grid (top-left origin).
    def to_grid(x: float, y: float) -> Tuple[int, int]:
        c = int(x / args.cell_size)
        r = rows - 1 - int(y / args.cell_size)
        return (r, c)

    start = find_nearest_free(inflated_grid, to_grid(sx, sy))
    end = find_nearest_free(inflated_grid, to_grid(ex, ey))

    result = {
        "width": cols,
        "height": rows,
        "cell_size_m": args.cell_size,
        "robot_radius_m": args.robot_radius,
        "grid": grid.tolist(),
        "inflated_grid": inflated_grid.tolist(),
        "start": list(start),
        "end": list(end),
        "debug_image": "",
    }

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)

    if args.debug:
        img_w, img_h = cols * 20, rows * 20
        debug = np.full((img_h, img_w, 3), 160, dtype=np.uint8)
        cell_w, cell_h = img_w / cols, img_h / rows
        for r in range(rows):
            for c in range(cols):
                x1, y1 = int(c * cell_w), int(r * cell_h)
                x2, y2 = int((c + 1) * cell_w), int((r + 1) * cell_h)
                if inflated_grid[r, c] == 1:
                    cv2.rectangle(debug, (x1, y1), (x2, y2), (60, 60, 60), -1)
                cv2.rectangle(debug, (x1, y1), (x2, y2), (200, 200, 200), 1)
        if start:
            y, x = start
            cv2.circle(debug, (int((x + 0.5) * cell_w), int((y + 0.5) * cell_h)), max(6, int(min(cell_w, cell_h) * 0.4)), (0, 0, 255), -1)
        if end:
            y, x = end
            cv2.circle(debug, (int((x + 0.5) * cell_w), int((y + 0.5) * cell_h)), max(6, int(min(cell_w, cell_h) * 0.4)), (0, 255, 0), -1)
        cv2.imwrite(str(args.debug), debug)
        result["debug_image"] = str(Path(args.debug).resolve())
        print(f"[manual_maze_map] wrote debug image {args.debug}")

    with open(args.output, "w") as f:
        json.dump(result, f, indent=2)
    print(f"[manual_maze_map] wrote {args.output} ({cols}x{rows} grid)")


if __name__ == "__main__":
    main()
