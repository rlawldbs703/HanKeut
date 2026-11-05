import { createHandler } from "@/lib/api-handler";
import { runReply } from "@/lib/journey/service";
import { replyRequest } from "@/lib/journey/types";

// 별의 아이: 플레이어의 답에 반응 + 후속 질문
export const POST = createHandler(replyRequest, (i) => runReply(i));
