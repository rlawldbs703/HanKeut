import { describe, expect, it } from "vitest";
import type { BattleRecord } from "@/types";
import { summarizeGrowth } from "./growth";

function record(i: number, total: number, result: "won" | "lost", scores = { logic: total, context: total, expression: total }): BattleRecord {
  return {
    id: `r${i}`,
    scenarioId: "s",
    scenarioTitle: "t",
    category: "work",
    result,
    finalGauge: 50,
    turnsUsed: 5,
    scores,
    total,
    createdAt: new Date(2026, 10, 5, 0, i).toISOString(),
    aiSource: "demo",
  };
}

describe("summarizeGrowth", () => {
  it("기록이 없으면 0과 null", () => {
    const s = summarizeGrowth([]);
    expect(s).toMatchObject({ totalBattles: 0, winRate: 0, averageTotal: 0, weakest: null, recentChange: null });
  });

  it("승률, 평균, 가장 약한 역량을 계산한다", () => {
    const s = summarizeGrowth([
      record(1, 60, "won", { logic: 70, context: 60, expression: 50 }),
      record(2, 80, "lost", { logic: 90, context: 80, expression: 70 }),
    ]);
    expect(s.totalBattles).toBe(2);
    expect(s.winRate).toBe(50);
    expect(s.averageTotal).toBe(70);
    expect(s.averageScores).toEqual({ logic: 80, context: 70, expression: 60 });
    expect(s.weakest).toBe("expression");
  });

  it("6판 이상이면 최근 5판과 이전 기록의 차이를 계산한다", () => {
    const records = [record(0, 40, "lost"), ...[1, 2, 3, 4, 5].map((i) => record(i, 70, "won"))];
    expect(summarizeGrowth(records).recentChange).toBe(30);
  });
});
