import { rateLimit } from "@/lib/rate-limit";
import { runTiniChat } from "@/lib/ai/service";
import { createHandler } from "@/lib/api-handler";
import { tiniRequest } from "@/lib/api-schemas";

// MY MINI-TTINI 고민 상담
const handler = createHandler(tiniRequest, (input) => runTiniChat(input));

export async function POST(request: Request) {
  return rateLimit(request, "tini", 20) ?? handler(request);
}
