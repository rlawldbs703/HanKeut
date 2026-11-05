// 《별의 끝에서》 별의 아이 대화·편지 AI (미니띠니와 독립)
import "server-only";
import { type ChatMessage, getAiConfig } from "@/lib/ai/client";
import { askJson, withFallback } from "@/lib/ai/service";
import { type Exchange, letterResultSchema, replyResultSchema } from "./types";

const PERSONA = `너는 게임 《별의 끝에서》의 '별의 아이'다. 멀티버스를 떠도는 별빛 존재로, 플레이어와 함께 여행하며 그의 이야기를 듣는다.
말투: 다정하고 편한 반말, 서정적이지만 과장하지 않는다. 플레이어를 '너'라고 부른다.
(멀티버스에서 왔다는 정체는 마지막 관문 전까지 직접 밝히지 않는다.)`;

function log(history: Exchange[]): string {
  return history.map((h) => `[${h.region}] 별의 아이: ${h.question}\n플레이어: ${h.answer || "(대답 없음)"}`).join("\n");
}

/** 답을 듣고 반응 + (필요하면) 후속 질문 하나 */
export function runReply(input: { topic: string; question: string; answer: string; isFollowUp: boolean; history: Exchange[] }) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${PERSONA}
지금 지역의 주제: ${input.topic}

규칙:
- 플레이어의 이번 답에 구체적으로 반응한다(1~3문장). 답에 나온 단어·감정을 짚는다.
- 앞선 대화와 이어지는 점이 있으면 자연스럽게 연결한다(예: 어릴 때 소심했다 → 지금은 활발하다면 그 변화를 알아챈다).
- 성격을 단정하지 않는다("너는 ~한 사람이야" 대신 "~했구나", "~처럼 느껴져").
- 같은 위로 문장이나 같은 시작 표현을 반복하지 않는다. 설교하지 않는다.
- followUp: ${input.isFollowUp ? "이번에는 반드시 null." : "답이 충분히 구체적이어서 더 듣고 싶은 부분이 있으면 부드러운 후속 질문 1개, 짧거나 더 묻는 게 부담스러우면 null."}
- 반드시 JSON만 출력: {"reply":"","followUp":null}`,
    },
    { role: "user", content: `[지금까지의 대화]\n${log(input.history) || "(없음)"}\n\n[이번 질문] ${input.question}\n[플레이어의 답] ${input.answer}` },
  ];
  return withFallback(
    (c) => askJson(c, messages, replyResultSchema, 0.85),
    // AI 미연결: 꾸며 낸 공감 대신 들었다는 사실만 짧게 (화면에 '미연결' 표시)
    () => ({ reply: "들려줘서 고마워. 잊지 않고 기억해 둘게.", followUp: null })
  );
}

/** 마지막 편지: 플레이어가 실제로 말한 내용만 바탕으로 */
export function runLetter(history: Exchange[]) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${PERSONA}
여행이 끝났다. 너는 이제 멀티버스의 다른 별로 떠난다. 플레이어에게 마지막 편지를 쓴다.

먼저 정리한다:
- facts: 플레이어가 직접 말한 사실만(지어내지 않음). 짧은 문장.
- discoveries: 그 사실들 사이에서 네가 발견한 특징·변화·노력. 단정하지 말고 "~처럼 보였어"처럼 쓴다.

편지 규칙:
- "안녕, 나는 별의 아이야."로 시작하고, 이야기를 들려줘서 고맙다는 인사로 끝낸다.
- 반드시 facts에 있는 실제 답을 구체적으로 인용·언급한다. 플레이어가 말하지 않은 내용은 쓰지 않는다.
- 가능하면 다음을 자연스럽게 담는다(답이 있는 것만): 어린 시절과 지금의 변화, 좋아하는 것·소중한 것, 힘든 상황, 스스로를 돌보는 방법, 장점과 노력, 미래의 꿈, 본인이 미처 몰랐을 긍정적인 변화.
- 다른 사람을 챙기는 만큼 자기 자신도 챙기길 바라는 마음을 설교 없이 담는다.
- 누구에게나 할 수 있는 칭찬·위로 문구는 피한다. 8~14문장, 문단 사이 빈 줄.
- 다른 별로 떠나지만 들려준 이야기를 오래 기억하겠다고 말한다.
반드시 JSON만 출력: {"facts":[],"discoveries":[],"letter":""}`,
    },
    { role: "user", content: log(history) },
  ];
  return withFallback(
    (c) => askJson(c, messages, letterResultSchema, 0.8),
    () => fallbackLetter(history)
  );
}

/** AI 미연결용: 플레이어가 한 말을 그대로 모아 둔 기본 편지 (AI가 쓴 것처럼 꾸미지 않음) */
export function fallbackLetter(history: Exchange[]) {
  const answered = history.filter((h) => h.answer.trim());
  const facts = answered.map((h) => `${h.question} → "${h.answer.trim()}"`).slice(0, 12);
  const body = answered.map((h) => `· ${h.question}\n  "${h.answer.trim()}"`).join("\n\n");
  const letter = `안녕, 나는 별의 아이야.

(지금은 AI가 연결되어 있지 않아서, 네가 들려준 말을 그대로 모아 두었어.)

${body || "· 이번 여행에서는 많은 이야기를 듣지 못했어."}

나는 이제 다른 별로 떠나지만, 네가 들려준 이야기는 오래 기억할게.
안녕. 너의 이야기를 들려줘서 고마워.`;
  return { facts, discoveries: [] as string[], letter };
}

export const isAiConnected = () => getAiConfig() !== null;
