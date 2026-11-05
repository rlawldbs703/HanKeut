// 《별의 끝에서》 기억의 목소리·편지 AI (미니띠니와 프롬프트·기록 분리)
// 실제 LLM만 사용해요. 연결이 없거나 실패하면 대사를 꾸며 내지 않고 오류를 돌려줘요.
import "server-only";
import { type AiConfig, type ChatMessage, getAiConfig } from "@/lib/ai/client";
import { askJson } from "@/lib/ai/service";
import { HINTS } from "./regions";
import { type Exchange, letterResultSchema, replyResultSchema } from "./types";

export class JourneyAiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

const WORLD = `게임 《별의 끝에서》. 플레이어 자신이 '기억을 잃은 별의 아이'다. 별빛 세계를 여행하며 장소와 물건을 보고 잃어버린 기억(=플레이어의 실제 삶)을 떠올린다.
너는 별의 아이의 마음속에서 울리는 '별빛의 속삭임'이다. 플레이어를 '너'라고 부르며, 다정한 반말로 짧고 서정적으로 말한다.`;

function log(history: Exchange[]): string {
  return history.map((h) => `[${h.region}] 물음: ${h.question}\n플레이어: ${h.answer}`).join("\n");
}

function requireConfig(): AiConfig {
  const c = getAiConfig();
  if (!c) throw new JourneyAiError("AI(LLM)가 연결되지 않았어요. 관리자가 LLM을 연결하면 이어서 할 수 있어요.", 503);
  return c;
}

async function call<T>(fn: (c: AiConfig) => Promise<T>) {
  const c = requireConfig();
  try {
    return { ...(await fn(c)), source: c.provider };
  } catch (e) {
    console.error("[AI] 별의 끝에서 호출 실패:", (e as Error).message);
    throw new JourneyAiError("별빛이 잠시 흐려졌어요(AI 응답 실패). 다시 시도해 주세요.", 502);
  }
}

/** 플레이어의 답에 반응하고, 맥락에 맞는 다음 물음을 스스로 만들어요 */
export function runReply(input: { regionId: string; topic: string; question: string; answer: string; turnInSpot: number; history: Exchange[] }) {
  const hint = HINTS[input.regionId];
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${WORLD}
지금 장소의 기억 주제: ${input.topic}${hint ? `\n이 장소에서 아직 떠올리지 않은 결: "${hint}" (그대로 묻지 말고 대화 흐름에 맞게 바꿔서)` : ""}

규칙:
- reply: 플레이어의 이번 답에 담긴 구체적인 단어·감정을 짚어 1~3문장으로 반응한다. 기억이 하나 돌아온 듯한 느낌으로.
- 앞선 답들과 연결되는 점(변화, 반복되는 취향, 대비)이 있으면 자연스럽게 잇는다.
- 성격을 단정하지 않는다. 플레이어가 말하지 않은 경험을 지어내지 않는다.
- 같은 위로·같은 시작 표현을 반복하지 않는다. 설교하지 않는다.
- followUp: ${input.turnInSpot >= 1 ? "null (이 장소의 이야기는 충분하다)" : "답을 더 깊이 떠올리게 하는 간접적인 물음 1개. 설문처럼 묻지 말고 풍경·기억에 빗대어. 답이 너무 짧거나 부담스러워 보이면 null."}
반드시 JSON만 출력: {"reply":"","followUp":null}`,
    },
    { role: "user", content: `[지금까지 떠올린 기억]\n${log(input.history) || "(없음)"}\n\n[이번 물음] ${input.question}\n[플레이어의 답] ${input.answer}` },
  ];
  return call((c) => askJson(c, messages, replyResultSchema, 0.85));
}

/** 마지막 편지: 기록된 실제 답만 바탕으로 */
export function runLetter(history: Exchange[]) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${WORLD}
여행이 끝났다. 별의 아이(플레이어)는 잃어버린 기억이 모두 자기 이야기였음을 깨닫고 빛으로 흩어진다. 그 자리에 별빛이 기억해 둔 편지가 남는다.

먼저 정리한다:
- facts: 플레이어가 직접 말한 사실만. 지어내지 않는다.
- discoveries: 사실들 사이에서 보이는 변화·노력·소중한 것. 단정하지 말고 "~처럼 보였어"로.

편지(letter) 규칙:
- 받는 사람은 "별의 아이였던 너"다. "안녕, 별의 아이야."로 시작하고 별빛이 쓴 편지로 끝맺는다.
- facts의 실제 답을 구체적으로 언급한다. 말하지 않은 내용은 쓰지 않는다.
- 답이 있는 것만 자연스럽게 담는다: 어린 시절과 지금의 변화, 좋아하는 것, 힘든 순간, 스스로를 돌보는 방법, 장점과 노력, 꿈, 본인이 몰랐을 긍정적 변화.
- 다른 사람을 챙기는 만큼 자신도 챙기길 바라는 마음을 설교 없이.
- 누구에게나 할 칭찬·위로는 피한다. 8~14문장, 문단 사이 빈 줄.
반드시 JSON만 출력: {"facts":[],"discoveries":[],"letter":""}`,
    },
    { role: "user", content: log(history) },
  ];
  return call((c) => askJson(c, messages, letterResultSchema, 0.8));
}
