import { runEvaluation } from "@/lib/ai/service";
import { createHandler } from "@/lib/api-handler";
import { evaluateRequest } from "@/lib/api-schemas";
import type { Scenario } from "@/types";

// 대결 종료 → 논리력·상황 이해력·표현력 평가 + 한끗 더 나은 답변
export const POST = createHandler(evaluateRequest, (input) =>
  runEvaluation({ ...input, scenario: input.scenario as Scenario })
);
