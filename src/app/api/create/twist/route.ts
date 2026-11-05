import { createHandler } from "@/lib/api-handler";
import { runTwist } from "@/lib/create/service";
import { twistRequest } from "@/lib/create/types";

// TWIST: 서로 다른 방향의 제안 3개
export const POST = createHandler(twistRequest, (i) => runTwist(i.idea, i.steps));
