import { rateLimit } from "@/lib/rate-limit";
import { JourneyAiError, runLetter } from "@/lib/journey/service";
import { letterRequest } from "@/lib/journey/types";

// 마지막 편지: 기록된 실제 답변 기반 (실제 LLM)
export async function POST(request: Request) {
  const limited = rateLimit(request, "letter", 3);
  if (limited) return limited;
  const parsed = letterRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "요청 내용이 올바르지 않아요." }, { status: 400 });
  try {
    return Response.json(await runLetter(parsed.data.history));
  } catch (e) {
    const err = e instanceof JourneyAiError ? e : new JourneyAiError("잠시 후 다시 시도해 주세요.", 500);
    return Response.json({ error: err.message }, { status: err.status });
  }
}
