// MY GROWTH 통계를 계산하는 순수 함수예요.
import type { BattleRecord, Scores } from "@/types";

export type Competency = keyof Scores;

export const COMPETENCY_LABELS: Record<Competency, string> = {
  logic: "논리력",
  context: "상황 이해력",
  expression: "표현력",
};

export interface GrowthSummary {
  totalBattles: number;
  wins: number;
  winRate: number; // %
  averageTotal: number;
  averageScores: Scores;
  weakest: Competency | null;
  /** 최근 5판 평균 - 그 이전 평균 (기록이 6판 이상일 때만) */
  recentChange: number | null;
}

const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

export function summarizeGrowth(records: BattleRecord[]): GrowthSummary {
  const sorted = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const wins = sorted.filter((r) => r.result === "won").length;
  const averageScores: Scores = {
    logic: avg(sorted.map((r) => r.scores.logic)),
    context: avg(sorted.map((r) => r.scores.context)),
    expression: avg(sorted.map((r) => r.scores.expression)),
  };

  const weakest = sorted.length
    ? (Object.keys(averageScores) as Competency[]).reduce((w, k) =>
        averageScores[k] < averageScores[w] ? k : w
      )
    : null;

  let recentChange: number | null = null;
  if (sorted.length >= 6) {
    const recent = sorted.slice(-5).map((r) => r.total);
    const before = sorted.slice(0, -5).map((r) => r.total);
    recentChange = avg(recent) - avg(before);
  }

  return {
    totalBattles: sorted.length,
    wins,
    winRate: sorted.length ? Math.round((wins / sorted.length) * 100) : 0,
    averageTotal: avg(sorted.map((r) => r.total)),
    averageScores,
    weakest,
    recentChange,
  };
}
