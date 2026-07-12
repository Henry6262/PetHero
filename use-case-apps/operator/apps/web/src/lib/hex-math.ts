export const GRID_COLS = 41;
export const GRID_ROWS = 31;
export const HEX_SIZE = 2.0;
export const HEX_HEIGHT = 0.22;

export interface HexCell {
  index: number;
  col: number;
  row: number;
  q: number;
  r: number;
  x: number;
  z: number;
  street: boolean;
  route: boolean;
  stale: boolean;
  conflict: boolean;
  station: boolean;
  goal: boolean;
}

const topLeft = axialToWorld(...(Object.values(evenrToAxial(1, 1)) as [number, number]));
const bottomRight = axialToWorld(...(Object.values(evenrToAxial(GRID_COLS, GRID_ROWS)) as [number, number]));

export const GRID_CENTER = {
  x: (topLeft.x + bottomRight.x) / 2,
  z: (topLeft.z + bottomRight.z) / 2,
};

export function evenrToAxial(col: number, row: number): { q: number; r: number } {
  const r = row - 1;
  const q = col - 1 - Math.floor(r / 2);
  return { q, r };
}

export function axialToWorld(q: number, r: number): { x: number; z: number } {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const z = HEX_SIZE * ((3 / 2) * r);
  return { x, z };
}

export function worldToAxial(x: number, z: number): { q: number; r: number } {
  const q = (Math.sqrt(3) / 3 * x - (1 / 3) * z) / HEX_SIZE;
  const r = ((2 / 3) * z) / HEX_SIZE;
  return cubeRound(q, r);
}

export function pointInPolygon(x: number, z: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i];
    const [xj, zj] = polygon[j];
    const intersect = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function cubeRound(q: number, r: number): { q: number; r: number } {
  let s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs;
  else if (rDiff > sDiff) rr = -rq - rs;
  return { q: rq, r: rr };
}

export function generateCells(): HexCell[] {
  // Street grid scales with map size: every 3rd row and every 4th column.
  const streetRows = Array.from({ length: Math.floor((GRID_ROWS - 2) / 3) + 1 }, (_, i) => 2 + i * 3);
  const streetCols = Array.from({ length: Math.floor((GRID_COLS - 2) / 4) + 1 }, (_, i) => 2 + i * 4);

  // Route follows the street grid from station to goal.
  const routeCells = generateRouteCells();

  return Array.from({ length: GRID_COLS * GRID_ROWS }, (_, index) => {
    const row = Math.floor(index / GRID_COLS) + 1;
    const col = (index % GRID_COLS) + 1;
    const street = streetRows.includes(row) || streetCols.includes(col);
    const route = routeCells.includes(`${col}-${row}`);
    const stale = ["6-11", "10-8", "14-14"].includes(`${col}-${row}`);
    const conflict = ["10-8", "18-11"].includes(`${col}-${row}`);
    const station = col === 2 && row === 14;
    const goal = col === 18 && row === 2;
    const { q, r } = evenrToAxial(col, row);
    const { x, z } = axialToWorld(q, r);
    return { index, col, row, q, r, x, z, street, route, stale, conflict, station, goal };
  });
}

function generateRouteCells(): string[] {
  // Station and goal stay fixed in the demo; route weaves along streets.
  const stationCol = 2;
  const stationRow = 14;
  const goalCol = 18;
  const goalRow = 2;

  const cols = [2, 6, 10, 14, 18].filter((c) => c <= GRID_COLS);
  const rows = [14, 11, 8, 5, 2].filter((r) => r <= GRID_ROWS);

  const cells = new Set<string>();

  // Build the stair-step route: horizontal then vertical between each waypoint.
  let currentCol = stationCol;
  let currentRow = stationRow;

  for (let i = 0; i < cols.length - 1; i++) {
    const nextCol = cols[i + 1];
    const nextRow = rows[i + 1];

    // Horizontal segment at currentRow.
    const hStart = Math.min(currentCol, nextCol);
    const hEnd = Math.max(currentCol, nextCol);
    for (let c = hStart; c <= hEnd; c++) {
      cells.add(`${c}-${currentRow}`);
    }

    // Vertical segment at nextCol.
    const vStart = Math.min(currentRow, nextRow);
    const vEnd = Math.max(currentRow, nextRow);
    for (let r = vStart; r <= vEnd; r++) {
      cells.add(`${nextCol}-${r}`);
    }

    currentCol = nextCol;
    currentRow = nextRow;
  }

  // Ensure goal is included.
  cells.add(`${goalCol}-${goalRow}`);

  return Array.from(cells);
}
