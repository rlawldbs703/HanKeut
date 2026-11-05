// 관문 미니게임 규칙 (순수 함수 → 테스트 가능)

/* 그림자 평원: 6×5 격자, 한 칸씩 이동할 때마다 그림자도 한 칸 움직여요. */
export const SHADOW_W = 6;
export const SHADOW_H = 5;
export const SHADOW_START = { x: 0, y: 2 };
export const SHADOW_EXIT = { x: 5, y: 2 };
/** 그림자: 정해진 경로를 왕복 (step마다 다음 칸) */
export const SHADOW_PATHS: [number, number][][] = [
  [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
  [[3, 4], [3, 3], [3, 2], [3, 1], [3, 0]],
  [[4, 1], [4, 2], [4, 3]],
];

export function shadowAt(step: number): [number, number][] {
  return SHADOW_PATHS.map((path) => {
    const cycle = path.length * 2 - 2;
    const i = step % cycle;
    return path[i < path.length ? i : cycle - i];
  });
}

export type ShadowMove = { pos: { x: number; y: number }; step: number; hit: boolean; done: boolean };

export function moveInShadow(pos: { x: number; y: number }, step: number, dx: number, dy: number): ShadowMove {
  const nx = Math.max(0, Math.min(SHADOW_W - 1, pos.x + dx));
  const ny = Math.max(0, Math.min(SHADOW_H - 1, pos.y + dy));
  const next = step + 1;
  const hit = shadowAt(next).some(([x, y]) => x === nx && y === ny);
  if (hit) return { pos: { ...SHADOW_START }, step: next, hit: true, done: false }; // 닿으면 처음으로
  return { pos: { x: nx, y: ny }, step: next, hit: false, done: nx === SHADOW_EXIT.x && ny === SHADOW_EXIT.y };
}

/* 시간의 다락: 되찾은 기억 카드를 시간 순서(과거→미래)로 */
export function checkOrder(picked: number[], correct: number[]): "ok" | "wrong" | "partial" {
  for (let i = 0; i < picked.length; i++) if (picked[i] !== correct[i]) return "wrong";
  return picked.length === correct.length ? "ok" : "partial";
}

/* 별의 전당: 별 조각을 여행 순서대로 이어 별자리 완성 — 같은 규칙(checkOrder) 사용 */
