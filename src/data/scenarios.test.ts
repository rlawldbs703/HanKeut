import { describe, expect, it } from "vitest";
import { CATEGORIES, SCENARIOS, getScenarioById, getScenariosByCategory } from "./scenarios";

describe("기본 시나리오 데이터", () => {
  it("카테고리마다 2개 이상 있다", () => {
    for (const c of CATEGORIES) expect(getScenariosByCategory(c).length).toBeGreaterThanOrEqual(2);
  });

  it("id가 겹치지 않는다", () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("게이지와 턴 값이 규칙에 맞다", () => {
    for (const s of SCENARIOS) {
      expect(s.startGauge).toBeGreaterThan(0);
      expect(s.goalGauge).toBeGreaterThan(s.startGauge);
      expect(s.goalGauge).toBeLessThanOrEqual(100);
      expect(s.maxTurns).toBeGreaterThanOrEqual(3);
      expect(s.openingLine.length).toBeGreaterThan(0);
    }
  });

  it("id로 찾을 수 있다", () => {
    expect(getScenarioById("work-late-report")?.character.name).toBe("김팀장");
    expect(getScenarioById("없는-id")).toBeUndefined();
  });
});
