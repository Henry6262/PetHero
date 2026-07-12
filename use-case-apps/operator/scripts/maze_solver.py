#!/usr/bin/env python3
"""
Binary maze grid → A* path → PiCrawler gait commands.

Usage:
    python3 scripts/maze_solver.py --input maze_map.json --output maze_plan.json

Calibration flags (measured on the demo floor):
    --forward-steps-per-cell 3   # how many 'forward' steps move one grid cell
    --turn-steps-per-90 2        # how many 'turn_left' steps rotate 90 degrees

Output JSON:
    {
      "path": [[r,c], [r,c], ...],
      "commands": [
        {"action": "forward", "steps": 3},
        {"action": "turn_left", "steps": 2},
        ...
      ],
      "heading": "N",
      "distance_cells": 42,
      "estimated_time_s": 68
    }

Supported actions in the PiCrawler bridge:
    forward, backward, turn_left, turn_right, sit
"""
import argparse
import json
import heapq
import math
import sys
from typing import Dict, List, Optional, Tuple


DIRECTIONS = {
    "N": (-1, 0),
    "E": (0, 1),
    "S": (1, 0),
    "W": (0, -1),
}

ORDER = ["N", "E", "S", "W"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Plan a maze path for PiCrawler")
    parser.add_argument("--input", "-i", required=True, help="Maze map JSON from maze_from_video.py")
    parser.add_argument("--output", "-o", default="maze_plan.json", help="Output plan JSON")
    parser.add_argument(
        "--use-inflated", action="store_true", default=True, help="Plan on inflated grid"
    )
    parser.add_argument(
        "--forward-steps-per-cell", type=int, default=3, help="Forward steps per grid cell"
    )
    parser.add_argument(
        "--turn-steps-per-90", type=int, default=2, help="Turn steps for 90 degrees"
    )
    parser.add_argument(
        "--speed", type=int, default=60, help="Default gait speed to suggest"
    )
    parser.add_argument(
        "--step-time-s", type=float, default=0.5, help="Seconds per forward step"
    )
    parser.add_argument(
        "--turn-time-s", type=float, default=0.4, help="Seconds per turn step"
    )
    parser.add_argument(
        "--pause-s", type=float, default=0.2, help="Pause between commands"
    )
    return parser.parse_args()


def load_map(path: str) -> Dict:
    with open(path) as f:
        return json.load(f)


def astar(grid: List[List[int]], start: Tuple[int, int], end: Tuple[int, int]) -> Optional[List[Tuple[int, int]]]:
    rows, cols = len(grid), len(grid[0])
    open_set = [(0, start)]
    came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}
    g_score = {start: 0}
    f_score = {start: heuristic(start, end)}

    while open_set:
        _, current = heapq.heappop(open_set)
        if current == end:
            return reconstruct_path(came_from, current)

        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = current[0] + dr, current[1] + dc
            neighbor = (nr, nc)
            if not (0 <= nr < rows and 0 <= nc < cols):
                continue
            if grid[nr][nc] == 1:
                continue
            tentative_g = g_score[current] + 1
            if tentative_g < g_score.get(neighbor, math.inf):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + heuristic(neighbor, end)
                heapq.heappush(open_set, (f_score[neighbor], neighbor))
    return None


def heuristic(a: Tuple[int, int], b: Tuple[int, int]) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def reconstruct_path(came_from: Dict[Tuple[int, int], Tuple[int, int]], current: Tuple[int, int]) -> List[Tuple[int, int]]:
    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    return list(reversed(path))


def heading_between(a: Tuple[int, int], b: Tuple[int, int]) -> str:
    dr, dc = b[0] - a[0], b[1] - a[1]
    for name, (r, c) in DIRECTIONS.items():
        if (dr, dc) == (r, c):
            return name
    return "N"


def turn_steps(from_heading: str, to_heading: str, steps_per_90: int) -> Tuple[str, int]:
    """Return (action, steps) to turn from one cardinal heading to another."""
    if from_heading == to_heading:
        return ("", 0)
    from_idx = ORDER.index(from_heading)
    to_idx = ORDER.index(to_heading)
    diff = (to_idx - from_idx) % 4
    if diff == 1:
        return ("turn_right", steps_per_90)
    if diff == 3:
        return ("turn_left", steps_per_90)
    # 180 degrees: two 90-degree turns.
    return ("turn_right", steps_per_90 * 2)


def path_to_commands(
    path: List[Tuple[int, int]],
    start_heading: str,
    forward_steps_per_cell: int,
    turn_steps_per_90: int,
) -> List[Dict[str, object]]:
    if len(path) < 2:
        return []

    commands: List[Dict[str, object]] = []
    heading = start_heading
    run_cells = 0

    for i in range(1, len(path)):
        next_heading = heading_between(path[i - 1], path[i])
        if next_heading != heading:
            if run_cells > 0:
                commands.append({"action": "forward", "steps": run_cells * forward_steps_per_cell})
                run_cells = 0
            action, steps = turn_steps(heading, next_heading, turn_steps_per_90)
            if action:
                commands.append({"action": action, "steps": steps})
            heading = next_heading
        run_cells += 1

    if run_cells > 0:
        commands.append({"action": "forward", "steps": run_cells * forward_steps_per_cell})

    # Sit at the end to stop sway.
    commands.append({"action": "sit", "steps": 1})
    return commands


def estimate_time(commands: List[Dict[str, object]], step_time: float, turn_time: float, pause: float) -> float:
    total = 0.0
    for cmd in commands:
        action = cmd["action"]
        steps = int(cmd["steps"])
        if action == "forward":
            total += steps * step_time
        elif action in ("turn_left", "turn_right"):
            total += steps * turn_time
        elif action == "sit":
            total += 0.3
        total += pause
    return total


def main() -> None:
    args = parse_args()
    maze = load_map(args.input)
    grid = maze["inflated_grid"] if args.use_inflated else maze["grid"]
    start = tuple(maze["start"])
    end = tuple(maze["end"])

    print(f"[maze_solver] planning {args.input}: {maze['width']}x{maze['height']}")
    path = astar(grid, start, end)
    if path is None:
        print("[maze_solver] ERROR: no path found", file=sys.stderr)
        # Write empty plan so callers can detect failure.
        with open(args.output, "w") as f:
            json.dump({"path": [], "commands": [], "error": "no path found"}, f, indent=2)
        sys.exit(1)

    commands = path_to_commands(
        path,
        start_heading="N",
        forward_steps_per_cell=args.forward_steps_per_cell,
        turn_steps_per_90=args.turn_steps_per_90,
    )

    plan = {
        "map_file": args.input,
        "width": maze["width"],
        "height": maze["height"],
        "cell_size_m": maze.get("cell_size_m", 0.1),
        "start": list(start),
        "end": list(end),
        "path": [list(p) for p in path],
        "commands": commands,
        "heading": "N",
        "distance_cells": len(path) - 1,
        "estimated_time_s": round(
            estimate_time(commands, args.step_time_s, args.turn_time_s, args.pause_s), 1
        ),
        "calibration": {
            "forward_steps_per_cell": args.forward_steps_per_cell,
            "turn_steps_per_90": args.turn_steps_per_90,
            "speed": args.speed,
        },
    }

    with open(args.output, "w") as f:
        json.dump(plan, f, indent=2)
    print(f"[maze_solver] wrote {args.output} ({len(path)} cells, {len(commands)} commands)")


if __name__ == "__main__":
    main()
