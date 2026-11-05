// 빛의 경로 퍼즐: 거울을 돌려 빛을 수정(목표)까지 연결해요.
export type Dir = "N" | "E" | "S" | "W";
export type Cell = "." | "/" | "\\" | "#" | "T"; // 빈칸, 거울 두 종류, 막힌 돌, 목표 수정

export interface LightPuzzle {
  grid: Cell[][];
  source: { row: number; col: number; dir: Dir }; // 빛이 처음 들어오는 칸과 방향
  rotatable: [number, number][]; // 플레이어가 돌릴 수 있는 거울 위치
}

const MOVE: Record<Dir, [number, number]> = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const SLASH: Record<Dir, Dir> = { E: "N", N: "E", W: "S", S: "W" }; // '/'
const BACKSLASH: Record<Dir, Dir> = { E: "S", S: "E", W: "N", N: "W" }; // '\'

/** 잊혀진 정원 퍼즐 (5×5). 정답: (2,1)'/', (0,1)'/', (0,3)'\', (3,3)'\' */
export function createGardenPuzzle(): LightPuzzle {
  return {
    grid: [
      [".", "\\", ".", "/", "#"],
      [".", ".", "#", ".", "."],
      [".", "\\", ".", ".", "#"],
      ["#", ".", ".", "/", "T"],
      [".", ".", "#", ".", "."],
    ],
    source: { row: 2, col: 0, dir: "E" },
    rotatable: [
      [2, 1],
      [0, 1],
      [0, 3],
      [3, 3],
    ],
  };
}

/** 빛이 지나가는 칸 목록과 목표 도달 여부 */
export function traceLight(p: LightPuzzle): { path: [number, number][]; reached: boolean } {
  let { row, col, dir } = p.source;
  const path: [number, number][] = [];
  const seen = new Set<string>();
  while (row >= 0 && col >= 0 && row < p.grid.length && col < p.grid[0].length) {
    const key = `${row},${col},${dir}`;
    if (seen.has(key)) break; // 빛이 같은 길을 맴돌면 멈춤
    seen.add(key);
    const cell = p.grid[row][col];
    if (cell === "#") break;
    path.push([row, col]);
    if (cell === "T") return { path, reached: true };
    if (cell === "/") dir = SLASH[dir];
    if (cell === "\\") dir = BACKSLASH[dir];
    row += MOVE[dir][0];
    col += MOVE[dir][1];
  }
  return { path, reached: false };
}

/** 거울 돌리기 ('/' ↔ '\'). 돌릴 수 없는 칸은 그대로. 원래 퍼즐은 바꾸지 않아요. */
export function rotateMirror(p: LightPuzzle, row: number, col: number): LightPuzzle {
  if (!p.rotatable.some(([r, c]) => r === row && c === col)) return p;
  const grid = p.grid.map((r) => [...r]);
  grid[row][col] = grid[row][col] === "/" ? "\\" : "/";
  return { ...p, grid };
}
