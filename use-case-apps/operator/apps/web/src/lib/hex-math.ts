export const GRID_COLS = 22;
export const GRID_ROWS = 16;
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
  return Array.from({ length: GRID_COLS * GRID_ROWS }, (_, index) => {
    const row = Math.floor(index / GRID_COLS) + 1;
    const col = (index % GRID_COLS) + 1;
    const street = [2, 5, 8, 11, 14].includes(row) || [2, 6, 10, 14, 18].includes(col);
    const route = ["2-14", "6-14", "6-11", "10-11", "10-8", "14-8", "14-5", "18-5", "18-2"].includes(`${col}-${row}`);
    const stale = ["6-11", "10-8", "14-14"].includes(`${col}-${row}`);
    const conflict = ["10-8", "18-11"].includes(`${col}-${row}`);
    const station = col === 2 && row === 14;
    const goal = col === 18 && row === 2;
    const { q, r } = evenrToAxial(col, row);
    const { x, z } = axialToWorld(q, r);
    return { index, col, row, q, r, x, z, street, route, stale, conflict, station, goal };
  });
}
