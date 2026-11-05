import { runTiniChat } from "@/lib/ai/service";
import { createHandler } from "@/lib/api-handler";
import { tiniRequest } from "@/lib/api-schemas";

// MY MINI-TTINI 고민 상담
export const POST = createHandler(tiniRequest, (input) => runTiniChat(input));
