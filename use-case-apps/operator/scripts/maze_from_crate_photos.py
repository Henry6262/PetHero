#!/usr/bin/env python3
"""
Dual crate-maze photos → unified binary grid map for Operator / PiCrawler demo.

Designed for bottle-crate mazes photographed from two opposite camera positions.
The script segments colored crates from the grey floor, registers the two partial
views with a Procrustes-like alignment, and emits the same JSON map format used
by maze-engine.ts and maze_solver.py.

Usage:
    python3 scripts/maze_from_crate_photos.py \
        --photo-a /Users/henry/Downloads/sadasdasssa/dji_mimo_20260711_195534_..._photo.JPG \
        --photo-b /Users/henry/Downloads/sadasdasssa/dji_mimo_20260711_195500_..._photo.JPG \
        --output results/maze_extraction/bottle_maze_map.json \
        --debug results/maze_extraction/bottle_maze_debug.jpg

Tunables:
    --physical-size-m   Width/height of the output square arena in meters.
    --cell-size-m       Grid resolution in meters.
    --robot-radius-m    Inflation radius for the robot footprint.
    --sat-threshold     HSV saturation threshold for "colored crate" vs grey floor.

The generated map is intentionally conservative: anything that looks like a crate
in either photo becomes a wall, and the convex hull of all crate pixels is treated
as the outer boundary (outside = wall).
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
except Exception as e:
    print(f"[maze_from_crate_photos] opencv import failed: {e}")
    HAS_CV2 = False
    sys.exit(1)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a maze map from two opposite crate-maze photos")
    parser.add_argument("--photo-a", required=True, help="First photo (e.g. entry/drone-start side)")
    parser.add_argument("--photo-b", required=True, help="Second photo from the opposite side")
    parser.add_argument("--output", "-o", default="bottle_maze_map.json", help="Output JSON path")
    parser.add_argument("--debug", "-d", default="", help="Path to write debug visualization image")
    parser.add_argument("--physical-size-m", type=float, default=2.5, help="Output arena width/height in meters")
    parser.add_argument("--cell-size-m", type=float, default=0.05, help="Grid cell size in meters")
    parser.add_argument("--robot-radius-m", type=float, default=0.08, help="Robot radius for wall inflation")
    parser.add_argument("--sat-threshold", type=int, default=35, help="HSV saturation threshold for colored crates")
    parser.add_argument("--value-min", type=int, default=40, help="Minimum V channel value to keep a pixel")
    parser.add_argument("--value-max", type=int, default=250, help="Maximum V channel value to keep a pixel")
    parser.add_argument("--morph-kernel", type=int, default=7, help="Morphological kernel size for cleaning masks")
    parser.add_argument("--min-crate-area-px", type=int, default=800, help="Minimum connected-component area to keep as a crate")
    parser.add_argument("--max-crate-area-px", type=int, default=80000, help="Maximum connected-component area to keep as a crate")
    parser.add_argument("--boundary-dilate-m", type=float, default=0.10, help="Dilate outer boundary by this many meters")
    parser.add_argument("--start-cell", default="auto", help="Start cell as 'row,col' or 'auto' (entry = bottom center)")
    parser.add_argument("--end-cell", default="auto", help="End/target cell as 'row,col' or 'auto' (center)")
    parser.add_argument(
        "--wall-threshold",
        type=float,
        default=0.25,
        help="Fraction of crate-colored pixels in a cell required to mark it as a wall",
    )
    return parser.parse_args()


def detect_crate_mask(
    frame: np.ndarray,
    sat_threshold: int,
    value_min: int,
    value_max: int,
    morph_kernel: int,
    min_area_px: int = 800,
    max_area_px: int = 80000,
) -> np.ndarray:
    """
    Return binary mask where colored crates are 1 and grey floor/background is 0.

    Uses saturation to find colored objects, then keeps only connected components
    whose area looks like a bottle crate (not a chair, table, or speck of dust).
    """
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    sat = hsv[:, :, 1]
    val = hsv[:, :, 2]
    mask = ((sat > sat_threshold) & (val > value_min) & (val < value_max)).astype(np.uint8) * 255

    kernel = np.ones((morph_kernel, morph_kernel), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    # Keep only crate-sized connected components.
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    cleaned = np.zeros_like(mask)
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if min_area_px <= area <= max_area_px:
            cleaned[labels == i] = 255
    return cleaned


def crate_centroid(mask: np.ndarray) -> Tuple[int, int]:
    """Centroid of all crate pixels in the mask."""
    ys, xs = np.where(mask > 127)
    if len(xs) == 0:
        h, w = mask.shape
        return (w // 2, h // 2)
    return (int(np.median(xs)), int(np.median(ys)))


def sample_boundary_points(mask: np.ndarray, n_points: int = 128) -> np.ndarray:
    """Return N evenly-spaced points along the convex hull of the crate mask."""
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return np.zeros((0, 2))
    all_pts = np.vstack(contours).reshape(-1, 2)
    hull = cv2.convexHull(all_pts)
    hull_pts = hull.reshape(-1, 2).astype(np.float64)
    if len(hull_pts) < 3:
        return hull_pts

    # Walk the perimeter and sample evenly.
    pts_closed = np.vstack([hull_pts, hull_pts[0]])
    diffs = np.diff(pts_closed, axis=0)
    seg_lens = np.linalg.norm(diffs, axis=1)
    total = seg_lens.sum()
    if total == 0:
        return hull_pts

    sample_interval = total / n_points
    samples: List[List[float]] = []
    dist_remaining = 0.0
    for i in range(len(hull_pts)):
        p1 = hull_pts[i]
        p2 = hull_pts[(i + 1) % len(hull_pts)]
        seg = p2 - p1
        seg_len = np.linalg.norm(seg)
        if seg_len == 0:
            continue
        while dist_remaining <= seg_len:
            t = dist_remaining / seg_len
            samples.append((p1 + t * seg).tolist())
            dist_remaining += sample_interval
        dist_remaining -= seg_len
    return np.array(samples, dtype=np.float64)


def procrustes_alignment(src: np.ndarray, dst: np.ndarray) -> Tuple[np.ndarray, float, float, np.ndarray]:
    """
    Find similarity transform (scale, rotation, translation) that best aligns
    src points to dst points. Returns (R, scale, theta, translation).
    R is 2x2 rotation matrix, scale is scalar, translation is [tx, ty].
    """
    assert src.shape == dst.shape and len(src) >= 2
    src_c = src.mean(axis=0)
    dst_c = dst.mean(axis=0)
    src_norm = src - src_c
    dst_norm = dst - dst_c

    scale_src = np.linalg.norm(src_norm) / math.sqrt(len(src))
    scale_dst = np.linalg.norm(dst_norm) / math.sqrt(len(dst))
    if scale_src == 0 or scale_dst == 0:
        return np.eye(2), 1.0, 0.0, dst_c - src_c

    src_unit = src_norm / scale_src
    dst_unit = dst_norm / scale_dst

    H = src_unit.T @ dst_unit
    U, _, Vt = np.linalg.svd(H)
    R = Vt.T @ U.T
    if np.linalg.det(R) < 0:
        Vt[-1, :] *= -1
        R = Vt.T @ U.T

    theta = math.atan2(R[1, 0], R[0, 0])
    scale = scale_dst / scale_src
    translation = dst_c - scale * (R @ src_c)
    return R, scale, theta, translation


def transform_points(pts: np.ndarray, R: np.ndarray, scale: float, translation: np.ndarray) -> np.ndarray:
    return scale * (pts @ R.T) + translation


def mask_to_world_grid(
    mask: np.ndarray,
    center_px: Tuple[float, float],
    px_per_m: float,
    grid_cols: int,
    grid_rows: int,
    cell_size_m: float,
) -> np.ndarray:
    """
    Rasterize a binary mask into a grid where (0,0) is top-left and the center
    of the grid maps to center_px. Returns float occupancy [0,1].
    """
    ys, xs = np.where(mask > 127)
    if len(xs) == 0:
        return np.zeros((grid_rows, grid_cols), dtype=np.float32)

    cx, cy = center_px
    world_x = (xs - cx) / px_per_m
    world_y = -(ys - cy) / px_per_m
    cols = np.clip((world_x / (grid_cols * cell_size_m) + 0.5) * grid_cols, 0, grid_cols - 1).astype(int)
    rows = np.clip((-world_y / (grid_rows * cell_size_m) + 0.5) * grid_rows, 0, grid_rows - 1).astype(int)

    # Use np.add.at for binning.
    grid = np.zeros((grid_rows, grid_cols), dtype=np.float32)
    counts = np.zeros((grid_rows, grid_cols), dtype=np.float32)
    np.add.at(grid, (rows, cols), 1.0)
    np.add.at(counts, (rows, cols), 1.0)
    nonzero = counts > 0
    grid[nonzero] /= counts[nonzero]
    return grid


def convex_hull_mask(mask: np.ndarray, dilate_px: int = 0) -> np.ndarray:
    """Return a filled convex hull of the largest contour(s), optionally dilated."""
    hull_mask = np.zeros_like(mask)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return hull_mask
    all_pts = np.vstack(contours).reshape(-1, 2)
    hull = cv2.convexHull(all_pts)
    cv2.fillConvexPoly(hull_mask, hull, 255)
    if dilate_px > 0:
        kernel = np.ones((dilate_px, dilate_px), np.uint8)
        hull_mask = cv2.dilate(hull_mask, kernel, iterations=1)
    return hull_mask


def estimate_radius_px(boundary_pts: np.ndarray, center: Tuple[float, float]) -> float:
    if len(boundary_pts) == 0:
        return 0.0
    dists = np.linalg.norm(boundary_pts - np.array(center), axis=1)
    return float(np.median(dists))


def fit_circle(points: np.ndarray) -> Tuple[Tuple[float, float], float]:
    """
    Algebraic circle fit (Kasa) to a set of 2D points.
    Returns ((cx, cy), radius).
    """
    if len(points) < 3:
        return ((0.0, 0.0), 0.0)
    x = points[:, 0]
    y = points[:, 1]
    A = np.column_stack([x, y, np.ones(len(points))])
    b = x**2 + y**2
    sol, _, _, _ = np.linalg.lstsq(A, b, rcond=None)
    cx, cy = sol[0] / 2.0, sol[1] / 2.0
    radius = math.sqrt(sol[2] + cx**2 + cy**2)
    return ((cx, cy), radius)


def find_maze_center_and_radius(mask: np.ndarray) -> Tuple[Tuple[float, float], float]:
    """
    Find the maze center by fitting a circle to the crate boundary pixels.
    This is more robust than the centroid when only an arc of the circle is visible.
    """
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        h, w = mask.shape
        return ((w / 2, h / 2), min(h, w) / 3)
    all_pts = np.vstack(contours).reshape(-1, 2).astype(np.float64)
    # Subsample for speed.
    step = max(1, len(all_pts) // 2000)
    sample = all_pts[::step]
    (cx, cy), radius = fit_circle(sample)
    if radius <= 0 or not (0 <= cx < mask.shape[1] and 0 <= cy < mask.shape[0]):
        # Fall back to centroid of boundary pixels.
        cx, cy = all_pts.mean(axis=0)
        radius = float(np.median(np.linalg.norm(all_pts - np.array([cx, cy]), axis=1)))
    return ((cx, cy), radius)


def build_combined_grid(
    frame_a: np.ndarray,
    frame_b: np.ndarray,
    args: argparse.Namespace,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Build unified occupancy grid from two opposite-side photos.

    Each photo is assumed to be centered on the same circular crate maze, but
    taken from opposite sides. We independently locate each photo's maze center,
    rotate photo B by 180° (the cameras are opposite), scale to a common
    physical size, and overlay the two views.

    Returns (grid, inflated_grid, debug_top_down, warp_matrix_b_to_a).
    """
    mask_a = detect_crate_mask(
        frame_a, args.sat_threshold, args.value_min, args.value_max, args.morph_kernel,
        args.min_crate_area_px, args.max_crate_area_px
    )
    mask_b = detect_crate_mask(
        frame_b, args.sat_threshold, args.value_min, args.value_max, args.morph_kernel,
        args.min_crate_area_px, args.max_crate_area_px
    )

    # Locate each maze independently by fitting a circle to the crate boundary.
    center_a, radius_a = find_maze_center_and_radius(mask_a)
    center_b, radius_b = find_maze_center_and_radius(mask_b)
    if radius_a == 0 or radius_b == 0:
        print("[maze_from_crate_photos] ERROR: could not estimate maze radius", file=sys.stderr)
        radius_a = radius_a or min(frame_a.shape[:2]) / 3
        radius_b = radius_b or min(frame_b.shape[:2]) / 3

    px_per_m_a = radius_a / (args.physical_size_m / 2)
    px_per_m_b = radius_b / (args.physical_size_m / 2)
    px_per_m = (px_per_m_a + px_per_m_b) / 2.0
    scale = px_per_m_a / px_per_m_b
    print(f"[maze_from_crate_photos] photo-a radius {radius_a:.0f}px ({px_per_m_a:.1f}px/m), center ({center_a[0]:.0f},{center_a[1]:.0f})")
    print(f"[maze_from_crate_photos] photo-b radius {radius_b:.0f}px ({px_per_m_b:.1f}px/m), center ({center_b[0]:.0f},{center_b[1]:.0f}), scale {scale:.3f}")

    grid_cols = int(round(args.physical_size_m / args.cell_size_m))
    grid_rows = grid_cols

    # Build warp that maps photo B into photo A's image frame.
    # 1. Translate photo B so its maze center is at origin.
    # 2. Scale to match photo A's resolution.
    # 3. Rotate 180° because the cameras are on opposite sides.
    # 4. Translate so the center lands on photo A's center.
    T1 = np.array([[1.0, 0.0, -center_b[0]], [0.0, 1.0, -center_b[1]], [0.0, 0.0, 1.0]])
    S = np.array([[scale, 0.0, 0.0], [0.0, scale, 0.0], [0.0, 0.0, 1.0]])
    R180 = np.array([[-1.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.0, 0.0, 1.0]])
    T2 = np.array([[1.0, 0.0, center_a[0]], [0.0, 1.0, center_a[1]], [0.0, 0.0, 1.0]])
    warp_3x3 = T2 @ R180 @ S @ T1
    warp = warp_3x3[:2, :].astype(np.float64)
    warped_b = cv2.warpAffine(mask_b, warp, (frame_a.shape[1], frame_a.shape[0]), borderValue=0)

    # Combine crate masks and hull masks in the unified frame.
    combined_mask = cv2.bitwise_or(mask_a, warped_b)
    boundary_dilate_px = int(round(args.boundary_dilate_m * px_per_m))
    hull_a = convex_hull_mask(mask_a, dilate_px=boundary_dilate_px)
    hull_b = convex_hull_mask(warped_b, dilate_px=boundary_dilate_px)
    combined_hull = cv2.bitwise_or(hull_a, hull_b)

    # Rasterize into the world grid.
    occ_crates = mask_to_world_grid(combined_mask, center_a, px_per_m, grid_cols, grid_rows, args.cell_size_m)
    occ_hull = mask_to_world_grid(combined_hull, center_a, px_per_m, grid_cols, grid_rows, args.cell_size_m)

    # A cell is a wall if it contains crates, OR if it is outside the combined hull.
    outside = occ_hull < 0.25
    wall = (occ_crates > args.wall_threshold) | outside
    grid = wall.astype(np.uint8)

    # Inflate walls by robot radius.
    inflate_cells = max(1, int(math.ceil(args.robot_radius_m / args.cell_size_m)))
    wall_mask = (grid == 1).astype(np.uint8) * 255
    big_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (inflate_cells * 2 + 1, inflate_cells * 2 + 1))
    inflated = cv2.dilate(wall_mask, big_kernel, iterations=1)
    inflated_grid = (inflated > 127).astype(np.uint8)

    # Debug top-down overlay.
    debug = frame_a.copy()
    blue_overlay = np.zeros_like(debug)
    blue_overlay[warped_b > 127] = [128, 0, 0]
    green_overlay = np.zeros_like(debug)
    green_overlay[mask_a > 127] = [0, 128, 0]
    debug = cv2.addWeighted(debug, 1.0, blue_overlay, 0.5, 0)
    debug = cv2.addWeighted(debug, 1.0, green_overlay, 0.5, 0)

    return grid, inflated_grid, debug, warp


def parse_cell(s: str, default: Tuple[int, int], grid_rows: int, grid_cols: int) -> Tuple[int, int]:
    if s == "auto":
        return default
    parts = [int(v) for v in s.split(",")]
    if len(parts) != 2:
        raise ValueError(f"Cell must be 'row,col', got {s}")
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


def draw_debug_grid(
    top_down: np.ndarray,
    grid: np.ndarray,
    start: Tuple[int, int],
    end: Tuple[int, int],
    cell_size_m: float,
) -> np.ndarray:
    h, w = top_down.shape[:2]
    rows, cols = grid.shape
    cell_h, cell_w = h / rows, w / cols
    overlay = top_down.copy()
    wall_overlay = np.zeros_like(overlay)
    for r in range(rows):
        for c in range(cols):
            x1, y1 = int(c * cell_w), int(r * cell_h)
            x2, y2 = int((c + 1) * cell_w), int((r + 1) * cell_h)
            if grid[r, c] == 1:
                cv2.rectangle(wall_overlay, (x1, y1), (x2, y2), (0, 0, 200), -1)
            cv2.rectangle(overlay, (x1, y1), (x2, y2), (200, 200, 200), 1)
    overlay = cv2.addWeighted(overlay, 1.0, wall_overlay, 0.5, 0)
    if start:
        y, x = start
        cv2.circle(overlay, (int((x + 0.5) * cell_w), int((y + 0.5) * cell_h)), max(8, int(min(cell_w, cell_h) * 0.5)), (0, 0, 255), -1)
    if end:
        y, x = end
        cv2.circle(overlay, (int((x + 0.5) * cell_w), int((y + 0.5) * cell_h)), max(8, int(min(cell_w, cell_h) * 0.5)), (0, 255, 0), -1)
    return overlay


def main() -> None:
    global args
    args = parse_args()

    frame_a = cv2.imread(str(args.photo_a))
    frame_b = cv2.imread(str(args.photo_b))
    if frame_a is None or frame_b is None:
        print("[maze_from_crate_photos] ERROR: could not load one or both photos", file=sys.stderr)
        sys.exit(1)

    # Downsample for speed; 1920 px wide is plenty for maze extraction.
    def downsample(img: np.ndarray, max_width: int = 1920) -> np.ndarray:
        h, w = img.shape[:2]
        if w <= max_width:
            return img
        scale = max_width / w
        return cv2.resize(img, (max_width, int(h * scale)), interpolation=cv2.INTER_AREA)

    frame_a = downsample(frame_a)
    frame_b = downsample(frame_b)

    print(f"[maze_from_crate_photos] photo-a: {args.photo_a} {frame_a.shape}")
    print(f"[maze_from_crate_photos] photo-b: {args.photo_b} {frame_b.shape}")

    grid, inflated_grid, debug_top_down, _ = build_combined_grid(frame_a, frame_b, args)
    rows, cols = grid.shape
    print(f"[maze_from_crate_photos] generated {cols}x{rows} grid")

    # Default start = bottom center (entry), end = center (target zone).
    start_default = find_nearest_free(inflated_grid, (rows - 2, cols // 2))
    end_default = find_nearest_free(inflated_grid, (rows // 2, cols // 2))
    start = parse_cell(args.start_cell, start_default, rows, cols)
    end = parse_cell(args.end_cell, end_default, rows, cols)
    start = find_nearest_free(inflated_grid, start)
    end = find_nearest_free(inflated_grid, end)

    result = {
        "width": cols,
        "height": rows,
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
        debug_grid = draw_debug_grid(debug_top_down, inflated_grid, start, end, args.cell_size_m)
        cv2.imwrite(str(args.debug), debug_grid)
        result["debug_image"] = str(Path(args.debug).resolve())
        print(f"[maze_from_crate_photos] wrote debug image {args.debug}")

    with open(args.output, "w") as f:
        json.dump(result, f, indent=2)
    print(f"[maze_from_crate_photos] wrote {args.output}")


if __name__ == "__main__":
    main()
