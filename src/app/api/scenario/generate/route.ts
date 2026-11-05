import { runScenarioGeneration } from "@/lib/ai/service";
import { createHandler } from "@/lib/api-handler";
import { generateRequest } from "@/lib/api-schemas";
import type { Category } from "@/types";

// AI 맞춤 시나리오 생성
export const POST = createHandler(generateRequest, (input) =>
  runScenarioGeneration({ ...input, category: input.category as Category })
);
