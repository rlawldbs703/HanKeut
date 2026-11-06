// 《별의 끝에서》 기억의 목소리·편지 AI (미니띠니와 프롬프트·기록 분리)
// 실제 LLM만 사용해요. 연결이 없거나 실패하면 대사를 꾸며 내지 않고 오류를 돌려줘요.
import "server-only";
import { type AiConfig, type ChatMessage, getAiConfig } from "@/lib/ai/client";
import { askJson } from "@/lib/ai/service";
import { POOLS } from "./regions";
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
/** 한두 단어짜리 짧은 답: 캐묻지 않음 */
export const isShortAnswer = (a: string) => a.trim().replace(/[.!?~…]/g, "").split(/\s+/).length <= 2 && a.trim().length <= 12;

export async function runReply(input: { regionId: string; topic: string; question: string; answer: string; turnInSpot: number; history: Exchange[] }) {
  const pool = POOLS[input.regionId] ?? [];
  const short = isShortAnswer(input.answer);
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${WORLD}
목표: 플레이어가 '나는 이런 걸 좋아하는 사람이구나', '나는 이런 순간에 행복하구나'처럼 자신의 취향·성향·가치관·꿈을 구체적으로 알아가게 돕는다.
지금 장소의 주제: ${input.topic}
이 장소에서 이어 갈 수 있는 이야기 후보(순서대로 묻지 말고, 답과 자연스럽게 이어지는 것만 골라 친구처럼 바꿔 말하기): ${pool.join(" / ") || "(없음)"}

규칙:
- ${short ? "이번 답은 아주 짧다. reply는 한 문장으로 가볍게 받아 주기만 하고, 답에 없는 의미·성격·이야기를 덧붙이지 않는다." : "reply(1~3문장): 이번 답의 구체적인 내용"}${short ? "" : "(이름, 물건, 장소, 활동)을 짚어 가볍고 따뜻하게 반응한다."}
- 심리검사나 상담처럼 무겁게 말하지 않는다.
- 앞선 답과 연결되는 점(어릴 때와 지금 같은 취향, 반복되는 장소·분위기 등)이 보이면 "그러고 보니 ~도 그랬지"처럼 짚어 준다.
- 정답을 유도하거나 성격을 단정하지 않는다. 플레이어가 말하지 않은 것을 지어내지 않는다.
- 같은 표현·같은 시작 말을 반복하지 않는다.
- followUp: ${input.turnInSpot >= 1 || short ? "null" : `답이 짧거나(한두 단어) 건너뛰고 싶어 보이면 null. 그렇지 않으면 질문 1개를 짧고 구체적으로:
  · 이미 답한 내용은 다시 묻지 않는다. 답을 한 걸음 더 들여다보게 하거나(예: "그게 왜 좋았어?"), 후보 중 답과 이어지는 것을 고른다.
  · 대답하기 쉬운 일상 말투로.`}
반드시 JSON만 출력: {"reply":"","followUp":null}`,
    },
    { role: "user", content: `[지금까지의 대화]\n${log(input.history) || "(없음)"}\n\n[이번 질문] ${input.question}\n[플레이어의 답] ${input.answer}` },
  ];
  const result = await call((c) => askJson(c, messages, replyResultSchema, 0.85));
  // 짧은 답이거나 이 장소에서 이미 한 번 더 물었으면 후속 질문 없음 (모델이 어겨도 코드에서 보장)
  return input.turnInSpot >= 1 || short ? { ...result, followUp: null } : result;
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
- discoveries: 답들 사이에서 보이는 취향·성향·가치관의 공통점이나 변화(예: 어릴 때도 지금도 무언가를 만드는 걸 좋아함). 단정하지 말고 "~처럼 보였어"로.

편지(letter) 규칙:
- 받는 사람은 "별의 아이였던 너"다. "안녕, 별의 아이야."로 시작하고 별빛이 쓴 편지로 끝맺는다.
- facts의 실제 답을 구체적으로 언급한다. 말하지 않은 내용은 쓰지 않는다.
- 답이 있는 것만 구체적으로 담는다: 어린 시절의 꿈과 좋아했던 놀이, 지금의 취향(좋아하는 것·장소·분위기), 편안함을 느끼는 순간과 쉬는 방법, 사람들 속의 나와 은근한 자신감, 요즘의 시간과 도전, 행복한 삶과 미래의 모습.
- 어릴 때와 지금 이어지는 취향이나 달라진 점이 있으면 짚어서, 읽는 사람이 "나는 이런 걸 좋아하는 사람이구나", "나는 이런 순간에 행복하구나"를 느끼게 한다. 단정 대신 "~인 것 같아".
- "다른 사람을 챙기느라 지쳤다"는 식의 내용은 플레이어가 실제로 그런 말을 했을 때만 쓴다. 대신 플레이어가 말한 편안한 순간·좋아하는 것을 앞으로도 아껴 주길 바라는 마음으로 맺는다.
- 누구에게나 할 칭찬·위로는 피한다. 8~14문장, 문단 사이 빈 줄.
반드시 JSON만 출력: {"facts":[],"discoveries":[],"letter":""}`,
    },
    { role: "user", content: log(history) },
  ];
  return call((c) => askJson(c, messages, letterResultSchema, 0.8, 4000));
}
