// AI가 돌려준 글에서 JSON을 꺼내고, 모양이 맞는지 검사해요.
import { z } from "zod";
import { CATEGORIES } from "@/data/scenarios";
import { clamp, normalizeDelta } from "@/lib/game/engine";

/** ```json ... ``` 같은 감싸기나 앞뒤 설명이 있어도 첫 번째 JSON 객체를 꺼내요. */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("JSON을 찾지 못했어요.");

  let depth = 0;
  let inString = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
  }
  throw new Error("JSON이 끝나지 않았어요.");
}

const score = z.coerce.number().transform((n) => Math.round(clamp(n, 0, 100)));

export const turnResultSchema = z.object({
  reply: z.string().trim().min(1),
  delta: z.coerce.number().transform(normalizeDelta),
  reason: z.string().trim().min(1),
});

export const evaluationSchema = z
  .object({
    scores: z.object({ logic: score, context: score, expression: score }),
    feedback: z.object({ strengths: z.string().min(1), improvements: z.string().min(1) }),
    betterAnswer: z.object({
      original: z.string().min(1),
      improved: z.string().min(1),
      why: z.string().min(1),
    }),
  })
  .transform((e) => ({
    ...e,
    total: Math.round((e.scores.logic + e.scores.context + e.scores.expression) / 3),
  }));

export const generatedScenarioSchema = z.object({
  category: z.enum(CATEGORIES as [string, ...string[]]),
  title: z.string().min(1),
  situation: z.string().min(1),
  character: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    emoji: z.string().min(1).catch("🙂"),
    personality: z.string().min(1),
  }),
  mission: z.string().min(1),
  startGauge: z.coerce.number().transform((n) => Math.round(clamp(n, 20, 50))),
  goalGauge: z.coerce.number().transform((n) => Math.round(clamp(n, 65, 90))),
  openingLine: z.string().min(1),
});
