// API 라우트가 부르는 기능 함수들이에요.
// 틸론이 설정되어 있으면 실제 모델을 쓰고, 없거나 실패하면 데모 모드로 대신 답해요.
import "server-only";
import type { z } from "zod";
import type {
  AiSource,
  Category,
  ChatTurn,
  Evaluation,
  Scenario,
  TiniMessage,
  TiniPersona,
  TurnResult,
} from "@/types";
import { type AiConfig, type ChatMessage, chatCompletion, getAiConfig } from "./client";
import { demoEvaluate, demoScenario, demoTini, demoTurn } from "./demo";
import { evaluationSchema, extractJson, generatedScenarioSchema, turnResultSchema } from "./parse";
import {
  type Focus,
  buildEvaluationMessages,
  buildScenarioMessages,
  buildTiniMessages,
  buildTurnMessages,
} from "./prompts";

export type WithSource<T> = T & { source: AiSource; fallbackReason?: string };

/** JSON 응답을 받아 검사해요. 형식이 틀리면 한 번 더 요청해요. */
export async function askJson<S extends z.ZodTypeAny>(
  config: AiConfig,
  messages: ChatMessage[],
  schema: S,
  temperature: number
): Promise<z.output<S>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await chatCompletion(config, messages, { temperature });
    try {
      return schema.parse(extractJson(text));
    } catch (e) {
      lastError = e;
      messages = [
        ...messages,
        { role: "assistant", content: text },
        { role: "user", content: "형식이 잘못됐어. 설명 없이 요청한 JSON 하나만 다시 출력해." },
      ];
    }
  }
  throw lastError;
}

export async function withFallback<T>(
  run: (config: AiConfig) => Promise<T>,
  demo: () => T
): Promise<WithSource<T>> {
  const config = getAiConfig();
  if (!config) return { ...demo(), source: "demo", fallbackReason: "틸론 API가 설정되지 않았어요." };
  try {
    return { ...(await run(config)), source: "tilon" };
  } catch (e) {
    console.error("[AI] 틸론 호출 실패, 데모 모드로 대체:", (e as Error).message);
    return { ...demo(), source: "demo", fallbackReason: "틸론 응답에 실패해 데모 모드로 답했어요." };
  }
}

export function runTurn(input: {
  scenario: Scenario;
  gauge: number;
  history: ChatTurn[];
  userMessage: string;
}): Promise<WithSource<TurnResult>> {
  return withFallback(
    (c) =>
      askJson(
        c,
        buildTurnMessages(input.scenario, input.gauge, input.history, input.userMessage),
        turnResultSchema,
        0.7
      ),
    () => demoTurn(input.scenario, input.userMessage)
  );
}

export function runEvaluation(input: {
  scenario: Scenario;
  history: ChatTurn[];
  result: "won" | "lost";
}): Promise<WithSource<Evaluation>> {
  return withFallback(
    (c) =>
      askJson(c, buildEvaluationMessages(input.scenario, input.history, input.result), evaluationSchema, 0.3),
    () => demoEvaluate(input.history)
  );
}

export async function runScenarioGeneration(input: {
  category: Category;
  focus?: Focus;
}): Promise<WithSource<{ scenario: Scenario }>> {
  const id = `ai-${Date.now().toString(36)}`;
  const finish = (s: Omit<Scenario, "id" | "maxTurns"> & { maxTurns?: number }): { scenario: Scenario } => ({
    scenario: { ...s, category: input.category, maxTurns: 5, id, isAiGenerated: true },
  });
  return withFallback(
    async (c) => {
      const s = await askJson(c, buildScenarioMessages(input.category, input.focus), generatedScenarioSchema, 0.9);
      return finish({ ...s, category: input.category });
    },
    () => finish(demoScenario(input.category))
  );
}

export function runTiniChat(input: {
  profile: TiniPersona;
  messages: TiniMessage[];
}): Promise<WithSource<{ reply: string }>> {
  const last = input.messages.at(-1)?.content ?? "";
  return withFallback(
    async (c) => ({
      reply: (await chatCompletion(c, buildTiniMessages(input.profile, input.messages), { temperature: 0.8 })).trim(),
    }),
    () => ({ reply: demoTini(input.profile, last) })
  );
}

/** 화면 상단에 보여 줄 AI 연결 상태 (키는 절대 포함하지 않아요) */
export function getAiStatus(): { source: AiSource; model?: string } {
  const c = getAiConfig();
  return c ? { source: "tilon", model: c.model } : { source: "demo" };
}
