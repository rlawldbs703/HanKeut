import { z } from "zod";

const t = (max: number) => z.string().trim().max(max);

/** 질문 하나와 플레이어의 답, 별의 아이의 반응 */
export const exchangeSchema = z.object({
  region: t(40),
  question: t(300).min(1),
  answer: t(1000),
  reply: t(600).default(""),
});
export type Exchange = z.infer<typeof exchangeSchema>;

export const replyRequest = z.object({
  regionId: t(20),
  topic: t(40),
  question: t(300).min(1),
  answer: t(1000).min(1),
  turnInSpot: z.number().int().min(0).max(5).default(0),
  history: z.array(exchangeSchema).max(60),
});

export const replyResultSchema = z.object({
  reply: t(400).min(1),
  followUp: z.string().trim().max(200).nullable().catch(null),
});
export type ReplyResult = z.infer<typeof replyResultSchema>;

export const letterRequest = z.object({ history: z.array(exchangeSchema).min(1).max(60) });

export const letterResultSchema = z.object({
  facts: z.array(t(200)).max(12), // 플레이어가 직접 말한 사실
  discoveries: z.array(t(200)).max(8), // 그 안에서 발견한 특징·변화 (단정하지 않음)
  letter: t(3000).min(1),
});
export type LetterResult = z.infer<typeof letterResultSchema>;
