import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/data/scenarios";
import {
  applyTurn,
  createBattle,
  normalizeDelta,
  turnsLeft,
  validateUserMessage,
} from "./engine";

const scenario = { ...SCENARIOS[0], startGauge: 30, goalGauge: 70, maxTurns: 3 };
const ok = (delta: number) => ({ reply: "음…", delta, reason: "근거" });

describe("createBattle", () => {
  it("시작 게이지와 상대 첫 마디로 시작한다", () => {
    const s = createBattle(scenario);
    expect(s.gauge).toBe(30);
    expect(s.turn).toBe(0);
    expect(s.status).toBe("playing");
    expect(s.history).toEqual([{ role: "opponent", content: scenario.openingLine }]);
  });
});

describe("normalizeDelta", () => {
  it("-20~+20 정수로 맞춘다", () => {
    expect(normalizeDelta(55)).toBe(20);
    expect(normalizeDelta(-99)).toBe(-20);
    expect(normalizeDelta(7.6)).toBe(8);
    expect(normalizeDelta(Number.NaN)).toBe(0);
  });
});

describe("applyTurn", () => {
  it("게이지를 바꾸고 대화 기록에 근거와 상대 반응을 남긴다", () => {
    const next = applyTurn(createBattle(scenario), scenario, "  미안해  ", ok(15));
    expect(next.gauge).toBe(45);
    expect(next.turn).toBe(1);
    expect(next.history.at(-2)).toEqual({
      role: "user",
      content: "미안해",
      delta: 15,
      reason: "근거",
    });
    expect(next.history.at(-1)).toEqual({ role: "opponent", content: "음…" });
  });

  it("원래 상태를 바꾸지 않는다", () => {
    const s = createBattle(scenario);
    applyTurn(s, scenario, "안녕", ok(10));
    expect(s.gauge).toBe(30);
    expect(s.history).toHaveLength(1);
  });

  it("목표 게이지에 도달하면 승리", () => {
    let s = createBattle(scenario);
    s = applyTurn(s, scenario, "a1", ok(20));
    s = applyTurn(s, scenario, "a2", ok(20));
    expect(s.gauge).toBe(70);
    expect(s.status).toBe("won");
  });

  it("턴을 다 쓰면 패배", () => {
    let s = createBattle(scenario);
    for (let i = 0; i < 3; i++) s = applyTurn(s, scenario, `a${i}`, ok(1));
    expect(s.status).toBe("lost");
    expect(turnsLeft(s, scenario)).toBe(0);
  });

  it("게이지가 0이 되면 바로 패배하고 0 아래로 내려가지 않는다", () => {
    const s = applyTurn({ ...createBattle(scenario), gauge: 10 }, scenario, "됐어", ok(-20));
    expect(s.gauge).toBe(0);
    expect(s.status).toBe("lost");
  });

  it("끝난 대결에는 더 이상 반영하지 않는다", () => {
    const ended = { ...createBattle(scenario), status: "won" as const };
    expect(applyTurn(ended, scenario, "더", ok(10))).toBe(ended);
  });
});

describe("validateUserMessage", () => {
  it("너무 짧거나 긴 답변을 막는다", () => {
    expect(validateUserMessage(" ")).not.toBeNull();
    expect(validateUserMessage("가".repeat(301))).not.toBeNull();
    expect(validateUserMessage("죄송합니다")).toBeNull();
  });
});
