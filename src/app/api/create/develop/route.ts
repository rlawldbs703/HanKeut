import { createHandler } from "@/lib/api-handler";
import { runDevelop } from "@/lib/create/service";
import { developRequest } from "@/lib/create/types";

// CREATE: 사람의 선택·수정을 반영해 발전
export const POST = createHandler(developRequest, (i) => runDevelop(i.idea, i.steps, i.chosen, i.userEdit));
