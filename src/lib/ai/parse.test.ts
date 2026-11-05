import { describe, expect, it } from "vitest";
import { evaluationSchema, extractJson, generatedScenarioSchema, turnResultSchema } from "./parse";

describe("extractJson", () => {
  it("코드블록과 앞뒤 설명이 있어도 JSON을 꺼낸다", () => {
    const text = '네, 결과입니다.\n```json\n{"reply":"좋아 {괄호}","delta":5,"reason":"r"}\n```\n끝';
    expect(extractJson(text)).toEqual({ reply: "좋아 {괄호}", delta: 5, reason: "r" });
  });

  it("JSON이 없으면 오류", () => {
    expect(() => extractJson("JSON 없음")).toThrow();
  });
});

describe("turnResultSchema", () => {
  it("문자열 숫자를 바꾸고 delta를 범위 안으로 자른다", () => {
    expect(turnResultSchema.parse({ reply: "음", delta: "35", reason: "r" }).delta).toBe(20);
  });

  it("reply가 비면 실패", () => {
    expect(() => turnResultSchema.parse({ reply: " ", delta: 1, reason: "r" })).toThrow();
  });
});

describe("evaluationSchema", () => {
  it("점수를 0~100으로 자르고 총점을 평균으로 계산한다", () => {
    const e = evaluationSchema.parse({
      scores: { logic: 120, context: 60, expression: "70" },
      feedback: { strengths: "s", improvements: "i" },
      betterAnswer: { original: "o", improved: "b", why: "w" },
    });
    expect(e.scores).toEqual({ logic: 100, context: 60, expression: 70 });
    expect(e.total).toBe(77);
  });
});

describe("generatedScenarioSchema", () => {
  it("게이지 값을 안전한 범위로 맞춘다", () => {
    const s = generatedScenarioSchema.parse({
      category: "work",
      title: "t",
      situation: "s",
      character: { name: "n", role: "r", emoji: "", personality: "p" },
      mission: "m",
      startGauge: 5,
      goalGauge: 100,
      openingLine: "o",
    });
    expect(s.startGauge).toBe(20);
    expect(s.goalGauge).toBe(90);
    expect(s.character.emoji).toBe("🙂");
  });
});
