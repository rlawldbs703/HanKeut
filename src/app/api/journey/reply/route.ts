import { rateLimit } from "@/lib/rate-limit";
import { JourneyAiError, runReply } from "@/lib/journey/service";
import { replyRequest } from "@/lib/journey/types";

// 기억의 목소리: 플레이어의 답에 반응 + 맥락에 맞는 다음 물음 (실제 LLM)
export async function POST(request: Request) {
  const limited = rateLimit(request, "reply", 20);
  if (limited) return limited;
  const parsed = replyRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "요청 내용이 올바르지 않아요." }, { status: 400 });
  try {
    return Response.json(await runReply(parsed.data));
  } catch (e) {
    const err = e instanceof JourneyAiError ? e : new JourneyAiError("잠시 후 다시 시도해 주세요.", 500);
    return Response.json({ error: err.message }, { status: err.status });
  }
}
