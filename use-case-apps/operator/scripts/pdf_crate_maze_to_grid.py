#!/usr/bin/env python3
"""
Convert a measured PDF plan of a bottle-crate maze into an occupancy grid.

The PDF is expected to contain black-filled polygons for each crate side.
Scale is auto-detected from the crate side lengths (100 PDF points ≈ 1 m).
Use manual_maze_map.py for hand-entered axis-aligned rectangles; this script
is for real measured PDFs with arbitrary rotation.

Usage:
    python3 scripts/pdf_crate_maze_to_grid.py \
        --pdf /Users/henry/Downloads/wwweqqe/saddddsvggg/ddas.pdf \
        --cell-size 0.05 --robot-radius 0.08 \
        --start 1.5,0.5 --end 1.5,3.0 \
        --output results/maze_extraction/ddas_maze_map.json \
        --debug results/maze_extraction/ddas_maze_debug.png
"""
import argparse
import json
import math
import sys
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np

try:
    import fitz  # PyMuPDF
except Exception as e:
    print(f"[pdf_crate_maze_to_grid] PyMuPDF not installed: {e}")
    sys.exit(1)


def parse_point(s: str) -> Tuple[float, float]:
    parts = [float(v) for v in s.split(",")]
    if len(parts) != 2:
        raise ValueError(f"Point must be x,y; got {s}")
    return parts[0], parts[1]


def parse_rect(s: str) -> Tuple[float, float, float, float]:
    parts = [float(v) for v in s.split(",")]
    if len(parts) != 4:
        raise ValueError(f"Rectangle must be cx,cy,w,h; got {s}")
    return tuple(parts)


def polygon_from_path(path: dict) -> List[Tuple[float, float]]:
    """Return ordered polygon vertices from a PDF path's line items."""
    pts: List[Tuple[float, float]] = []
    for it in path["items"]:
        if it[0] == "l":
            a = (it[1].x, it[1].y)
            b = (it[2].x, it[2].y)
            if not pts:
                pts.extend([a, b])
            else:
                if math.hypot(a[0] - pts[-1][0], a[1] - pts[-1][1]) < 1e-3:
                    pts.append(b)
                else:
                    pts.extend([a, b])
        elif it[0] in ("c", "re"):
            # Bezier curves / rects: sample endpoints only for now
            # For rect, items are (re, rect)
            pass
    # Deduplicate close points
    uniq = []
    for p in pts:
        if not uniq or math.hypot(p[0] - uniq[-1][0], p[1] - uniq[-1][1]) > 1e-2:
            uniq.append(p)
    if len(uniq) > 1 and math.hypot(uniq[0][0] - uniq[-1][0], uniq[0][1] - uniq[-1][1]) < 1e-2:
        uniq.pop()
    return uniq


def extract_black_filled_polygons(page) -> List[List[Tuple[float, float]]]:
    polys = []
    for p in page.get_drawings():
        if p.get("fill") == (0.0, 0.0, 0.0) and p.get("type") in ("f", "fs"):
            poly = polygon_from_path(p)
            if len(poly) >= 3:
                polys.append(poly)
    return polys


def detect_scale(polys: List[List[Tuple[float, float]]]) -> float:
    """Return PDF units per meter by looking at the longest crate side."""
    best_len = 0.0
    for poly in polys:
        for i in range(len(poly)):
            x1, y1 = poly[i]
            x2, y2 = poly[(i + 1) % len(poly)]
            d = math.hypot(x2 - x1, y2 - y1)
            if d > best_len:
                best_len = d
    # The labelled lengths in the PDF are in meters with comma decimals.
    # The long crate sides are ~1 m each, so round the longest to nearest 0.1 m.
    if best_len == 0:
        raise ValueError("No crate sides found in PDF")
    meters = round(best_len / 100.0, 1)
    if meters == 0.0:
        meters = 1.0
    return best_len / meters


def main() -> None:
    parser = argparse.ArgumentParser(description="PDF crate maze → occupancy grid")
    parser.add_argument("--pdf", required=True, help="Input PDF path")
    parser.add_argument("--cell-size", type=float, default=0.05, help="Grid cell size in meters")
    parser.add_argument("--robot-radius", type=float, default=0.08, help="Robot radius for wall inflation")
    parser.add_argument("--scale", type=float, default=None, help="PDF points per meter (auto-detected if omitted)")
    parser.add_argument("--margin-m", type=float, default=0.20, help="Margin around the maze in meters")
    parser.add_argument("--start", default="auto", help="Start x,y in meters or 'auto' (centroid of free space)")
    parser.add_argument("--end", default="auto", help="Target x,y in meters or 'auto' (geometric center)")
    parser.add_argument(
        "--obstacle-rect",
        action="append",
        default=[],
        help="Extra axis-aligned obstacle as cx,cy,w,h in meters (can be repeated)",
    )
    parser.add_argument("--output", "-o", default="ddas_maze_map.json", help="Output JSON path")
    parser.add_argument("--debug", "-d", default="", help="Debug PNG path")
    args = parser.parse_args()

    doc = fitz.open(args.pdf)
    page = doc[0]
    polys = extract_black_filled_polygons(page)
    if not polys:
        print("[pdf_crate_maze_to_grid] No black-filled crate polygons found.")
        sys.exit(1)

    scale = args.scale or detect_scale(polys)
    print(f"[pdf_crate_maze_to_grid] detected scale = {scale:.2f} PDF points/m")

    all_x = [x for poly in polys for x, y in poly]
    all_y = [y for poly in polys for x, y in poly]
    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)

    # Convert to meters with bottom-left origin
    width_m = (max_x - min_x) / scale + 2 * args.margin_m
    height_m = (max_y - min_y) / scale + 2 * args.margin_m

    cols = int(math.ceil(width_m / args.cell_size))
    rows = int(math.ceil(height_m / args.cell_size))

    grid = np.zeros((rows, cols), dtype=np.uint8)

    def to_grid(x_pdf: float, y_pdf: float) -> Tuple[float, float]:
        x_m = (x_pdf - min_x) / scale + args.margin_m
        y_m = (max_y - y_pdf) / scale + args.margin_m
        c = x_m / args.cell_size
        r = y_m / args.cell_size
        return r, c

    # Rasterize each crate polygon
    for poly in polys:
        pts = np.array([[to_grid(x, y) for x, y in poly]], dtype=np.float32)
        pts = np.round(pts).astype(np.int32)
        cv2.fillPoly(grid, [pts], 1)

    # Rasterize optional extra obstacles (e.g. the central crate cluster)
    for rect in args.obstacle_rect:
        cx, cy, w, h = parse_rect(rect)
        x1, x2 = cx - w / 2, cx + w / 2
        y1, y2 = cy - h / 2, cy + h / 2
        c1 = max(0, int(x1 / args.cell_size))
        c2 = min(cols - 1, int(x2 / args.cell_size))
        r1 = max(0, int(y1 / args.cell_size))
        r2 = min(rows - 1, int(y2 / args.cell_size))
        grid[r1 : r2 + 1, c1 : c2 + 1] = 1

    # Inflate walls by robot radius
    inflate_cells = max(1, int(math.ceil(args.robot_radius / args.cell_size)))
    wall_mask = (grid == 1).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (inflate_cells * 2 + 1, inflate_cells * 2 + 1))
    inflated = cv2.dilate(wall_mask, kernel, iterations=1)
    inflated_grid = (inflated > 127).astype(np.uint8)

    # Start / end
    def find_nearest_free(target: Tuple[int, int]) -> Tuple[int, int]:
        tr, tc = target
        if 0 <= tr < rows and 0 <= tc < cols and inflated_grid[tr, tc] == 0:
            return target
        best = target
        best_d = math.inf
        for r in range(rows):
            for c in range(cols):
                if inflated_grid[r, c] == 0:
                    d = abs(r - tr) + abs(c - tc)
                    if d < best_d:
                        best_d = d
                        best = (r, c)
        return best

    if args.start == "auto":
        # Use a free cell near the geometric center of the arena
        sr, sc = rows // 2, cols // 2
    else:
        sx, sy = parse_point(args.start)
        sc = int(sx / args.cell_size)
        sr = rows - 1 - int(sy / args.cell_size)
    start = find_nearest_free((sr, sc))

    if args.end == "auto":
        er, ec = rows // 2, cols // 2
    else:
        ex, ey = parse_point(args.end)
        ec = int(ex / args.cell_size)
        er = rows - 1 - int(ey / args.cell_size)
    end = find_nearest_free((er, ec))

    result = {
        "width": cols,
        "height": rows,
        "cell_size_m": args.cell_size,
        "robot_radius_m": args.robot_radius,
        "scale_pdf_points_per_m": scale,
        "grid": grid.tolist(),
        "inflated_grid": inflated_grid.tolist(),
        "start": list(start),
        "end": list(end),
        "debug_image": "",
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if args.debug:
        cell_px = 20
        img_w, img_h = cols * cell_px, rows * cell_px
        debug = np.full((img_h, img_w, 3), 210, dtype=np.uint8)
        for r in range(rows):
            for c in range(cols):
                x1, y1 = c * cell_px, r * cell_px
                x2, y2 = x1 + cell_px, y1 + cell_px
                if inflated_grid[r, c] == 1:
                    cv2.rectangle(debug, (x1, y1), (x2, y2), (80, 80, 80), -1)
                elif grid[r, c] == 1:
                    cv2.rectangle(debug, (x1, y1), (x2, y2), (140, 140, 140), -1)
                cv2.rectangle(debug, (x1, y1), (x2, y2), (200, 200, 200), 1)
        sr, sc = start
        cv2.circle(debug, ((sc * cell_px) + cell_px // 2, (sr * cell_px) + cell_px // 2), max(6, cell_px // 2), (0, 0, 255), -1)
        er, ec = end
        cv2.circle(debug, ((ec * cell_px) + cell_px // 2, (er * cell_px) + cell_px // 2), max(6, cell_px // 2), (0, 255, 0), -1)
        cv2.imwrite(str(args.debug), debug)
        result["debug_image"] = str(Path(args.debug).resolve())
        print(f"[pdf_crate_maze_to_grid] wrote debug image {args.debug}")

    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"[pdf_crate_maze_to_grid] wrote {out_path} ({cols}x{rows} grid)")


if __name__ == "__main__":
    main()
