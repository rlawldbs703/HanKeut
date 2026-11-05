// 공동 창작(IDEA → TWIST → CREATE) 데이터 모양
import { z } from "zod";

const t = (max: number) => z.string().trim().max(max);

/** IDEA: 사람이 입력하는 게임 아이디어 */
export const ideaSchema = z.object({
  title: t(60).min(1),
  genre: t(60).default(""),
  world: t(500).default(""),
  character: t(500).default(""),
  story: t(800).default(""),
});
export type Idea = z.infer<typeof ideaSchema>;

/** TWIST: AI가 내는 서로 다른 방향의 제안 */
export const twistSchema = z.object({
  axis: t(30).min(1), // 어떤 방향으로 비틀었는지 (예: 관점 전환)
  title: t(60).min(1),
  pitch: t(400).min(1), // 제안 내용
  whyDifferent: t(200).min(1), // 원래 생각에서 한끗 달라진 점
});
export type Twist = z.infer<typeof twistSchema>;
export const twistResultSchema = z.object({ twists: z.array(twistSchema).min(3).max(3) });

/** CREATE: 사람의 선택/수정과 AI의 발전 결과가 쌓이는 기록 */
export const stepSchema = z.object({
  chosen: twistSchema,
  userEdit: t(600).default(""), // 사람이 직접 고친 내용
  result: t(1200).min(1), // 그 결과로 발전된 아이디어
});
export type CreationStep = z.infer<typeof stepSchema>;

export const developResultSchema = z.object({
  result: t(1200).min(1),
  nextQuestion: t(200).min(1), // 사람에게 넘기는 다음 고민
});
export type DevelopResult = z.infer<typeof developResultSchema>;

export const twistRequest = z.object({ idea: ideaSchema, steps: z.array(stepSchema).max(10) });
export const developRequest = z.object({
  idea: ideaSchema,
  steps: z.array(stepSchema).max(10),
  chosen: twistSchema,
  userEdit: t(600).default(""),
});
