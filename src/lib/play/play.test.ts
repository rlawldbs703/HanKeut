import { describe, expect, it } from "vitest";
import { createGardenPuzzle, rotateMirror, traceLight } from "./light";
import { RADIO_TARGET, clarity, garble, isTuned } from "./radio";
import { ENDING, GARDEN_FRAGMENT, HOUSE_OBJECTS, PROLOGUE, RADIO_RESTORED } from "./story";

describe("빛의 경로 퍼즐", () => {
  it("처음 상태에서는 목표에 닿지 않는다", () => {
    expect(traceLight(createGardenPuzzle()).reached).toBe(false);
  });

  it("정답대로 돌리면 수정에 닿는다", () => {
    let p = createGardenPuzzle();
    for (const [r, c] of [
      [2, 1],
      [0, 1],
      [0, 3],
      [3, 3],
    ] as const) p = rotateMirror(p, r, c);
    const t = traceLight(p);
    expect(t.reached).toBe(true);
    expect(t.path.at(-1)).toEqual([3, 4]);
  });

  it("돌릴 수 없는 칸은 그대로, 원본은 바뀌지 않는다", () => {
    const p = createGardenPuzzle();
    expect(rotateMirror(p, 1, 2)).toBe(p);
    rotateMirror(p, 2, 1);
    expect(p.grid[2][1]).toBe("\\");
  });
});

describe("라디오 주파수 퍼즐", () => {
  it("목표에 가까울수록 선명하다", () => {
    expect(clarity(RADIO_TARGET)).toBe(1);
    expect(clarity(RADIO_TARGET + 2)).toBeCloseTo(0.5);
    expect(clarity(88)).toBe(0);
    expect(isTuned(RADIO_TARGET + 0.2)).toBe(true);
    expect(isTuned(RADIO_TARGET + 1)).toBe(false);
  });

  it("선명도가 낮으면 글자를 가리고, 맞추면 원문", () => {
    const text = "기억하고 있어?";
    expect(garble(text, 0)).not.toContain("기");
    expect(garble(text, 1)).toBe(text);
    expect(garble(text, 0.5)).toHaveLength(text.length);
  });
});

describe("원작 대사 보존", () => {
  it("핵심 대사가 그대로 들어 있다", () => {
    const all = [...PROLOGUE, ...RADIO_RESTORED, ...GARDEN_FRAGMENT, ...ENDING].map((l) => l.text);
    expect(all).toContain("여기는 어디지? 나는 누구였을까?");
    expect(all).toContain("기억하고 있어? 그날의 별을.");
    expect(all).toContain("누군가를 위해 꼭 전해야 할 말이 있었던 것 같은데…");
    expect(ENDING.at(-1)?.text).toBe("아직… 널 기억하고 있어.");
  });

  it("별의 집에는 별 조각 3개가 있다", () => {
    expect(HOUSE_OBJECTS.filter((o) => o.kind === "fragment")).toHaveLength(3);
  });
});
