// 공동 창작 AI 기능: 틸론이 설정되면 실제 모델, 아니면 체험 모드(임시 로직)
import "server-only";
import { askJson, withFallback } from "@/lib/ai/service";
import type { ChatMessage } from "@/lib/ai/client";
import { mockDevelop, mockTwists } from "./mock";
import { type CreationStep, type Idea, type Twist, developResultSchema, twistResultSchema } from "./types";

function context(idea: Idea, steps: CreationStep[]): string {
  const log = steps
    .map((s, i) => `${i + 1}. [${s.chosen.axis}] ${s.chosen.title}${s.userEdit ? ` / 창작자 수정: ${s.userEdit}` : ""}\n결과: ${s.result}`)
    .join("\n");
  return `[게임 아이디어] ${idea.title} (${idea.genre})
세계관: ${idea.world}
캐릭터: ${idea.character}
스토리: ${idea.story}
[지금까지의 공동 창작 기록]
${log || "(아직 없음)"}`;
}

const RULE = `너는 게임 기획자와 함께 아이디어를 발전시키는 공동 창작 파트너다.
- 창작의 주도권은 사람에게 있다. 완성본을 대신 쓰지 말고 방향을 제안한다.
- 지금까지의 기록과 창작자의 수정 내용을 반드시 이어받는다.
- 비슷한 말을 반복하거나 길게 늘이지 말고, 한 단계 벗어난 새로운 가능성을 제시한다.`;

export function runTwist(idea: Idea, steps: CreationStep[]) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${RULE}
서로 다른 방향(axis)의 제안 3개를 만든다. 이미 기록에 있는 방향은 피한다.
반드시 JSON만 출력: {"twists":[{"axis":"","title":"","pitch":"","whyDifferent":""},...3개]}`,
    },
    { role: "user", content: context(idea, steps) },
  ];
  return withFallback(
    (c) => askJson(c, messages, twistResultSchema, 0.9),
    () => ({ twists: mockTwists(idea, steps) })
  );
}

export function runDevelop(idea: Idea, steps: CreationStep[], chosen: Twist, userEdit: string) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${RULE}
창작자가 고른 제안과 직접 수정한 내용을 반영해 아이디어를 한 단계 발전시킨다. 창작자의 수정이 제안보다 우선한다.
result는 5문장 이내, nextQuestion은 창작자가 스스로 결정할 질문 1개.
반드시 JSON만 출력: {"result":"","nextQuestion":""}`,
    },
    {
      role: "user",
      content: `${context(idea, steps)}
[이번 선택] [${chosen.axis}] ${chosen.title}: ${chosen.pitch}
[창작자 수정] ${userEdit || "(그대로 채택)"}`,
    },
  ];
  return withFallback(
    (c) => askJson(c, messages, developResultSchema, 0.7),
    () => mockDevelop(idea, steps, chosen, userEdit)
  );
}
