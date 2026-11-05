import { runTurn } from "@/lib/ai/service";
import { createHandler } from "@/lib/api-handler";
import { turnRequest } from "@/lib/api-schemas";
import type { Scenario } from "@/types";

// 사용자 답변 1턴 → 상대 반응 + 게이지 변화 + 근거
export const POST = createHandler(turnRequest, (input) =>
  runTurn({ ...input, scenario: input.scenario as Scenario })
);
