import { createHandler } from "@/lib/api-handler";
import { runLetter } from "@/lib/journey/service";
import { letterRequest } from "@/lib/journey/types";

// 마지막 편지: 실제 답변 기반 개인 맞춤 편지
export const POST = createHandler(letterRequest, (i) => runLetter(i.history));
