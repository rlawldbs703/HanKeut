// 화면 → 서버로 들어오는 요청 데이터 검사 규칙이에요.
import { z } from "zod";
import { CATEGORIES } from "@/data/scenarios";
import { MESSAGE_MAX_LENGTH } from "@/lib/game/engine";

const text = (max: number) => z.string().trim().min(1).max(max);
const category = z.enum(CATEGORIES as [string, ...string[]]);

export const scenarioInput = z.object({
  id: text(80),
  category,
  title: text(100),
  situation: text(600),
  character: z.object({
    name: text(30),
    role: text(40),
    emoji: text(16),
    personality: text(300),
  }),
  mission: text(300),
  startGauge: z.number().min(0).max(100),
  goalGauge: z.number().min(1).max(100),
  maxTurns: z.number().int().min(1).max(10),
  openingLine: text(300),
  isAiGenerated: z.boolean().optional(),
});

const chatTurn = z.object({
  role: z.enum(["user", "opponent"]),
  content: text(MESSAGE_MAX_LENGTH + 200),
  delta: z.number().optional(),
  reason: z.string().optional(),
});

export const turnRequest = z.object({
  scenario: scenarioInput,
  gauge: z.number().min(0).max(100),
  history: z.array(chatTurn).max(30),
  userMessage: text(MESSAGE_MAX_LENGTH),
});

export const evaluateRequest = z.object({
  scenario: scenarioInput,
  history: z.array(chatTurn).min(1).max(30),
  result: z.enum(["won", "lost"]),
});

export const generateRequest = z.object({
  category,
  focus: z.enum(["logic", "context", "expression"]).optional(),
});

export const tiniRequest = z.object({
  // 꾸미기(avatar)는 화면에서만 쓰므로 서버는 이름·성격·말투만 확인해요.
  profile: z.object({
    name: text(20),
    personality: z.enum(["warm", "realistic", "cheerful"]),
    speechStyle: z.enum(["casual", "polite"]),
  }),
  messages: z
    .array(z.object({ role: z.enum(["user", "tini"]), content: text(1000) }))
    .min(1)
    .max(50),
});
