// 틸론 GPU가 연결되지 않았거나 응답에 실패했을 때 쓰는 규칙 기반 '데모 모드'예요.
// 실제 AI가 아니므로 화면에 항상 "데모 모드"라고 표시해요.
import { SCENARIOS } from "@/data/scenarios";
import { clamp, normalizeDelta } from "@/lib/game/engine";
import type { Category, ChatTurn, Evaluation, Scenario, TiniProfile, TurnResult } from "@/types";

const RULES = [
  { re: /죄송|미안|사과/, delta: 6, label: "사과" },
  { re: /그랬구나|힘들|속상|이해|마음|서운|걱정/, delta: 6, label: "공감" },
  { re: /하겠|할게|드릴게|방법|계획|대신|까지|약속/, delta: 6, label: "해결책" },
  { re: /왜냐|때문|이유/, delta: 3, label: "이유 설명" },
  { re: /\?|어때|괜찮/, delta: 2, label: "상대 의견 묻기" },
];
const RUDE = /몰라|어쩌라|짜증|됐어|알아서|ㅡㅡ|그래서 뭐|상관없/;

export function demoTurn(scenario: Scenario, userMessage: string): TurnResult {
  const text = userMessage.trim();
  if (RUDE.test(text)) {
    return {
      delta: -15,
      reason: "무시하거나 공격적인 표현이 상대의 감정을 상하게 했어요.",
      reply: `…그렇게 말하면 나도 더 할 말 없어. (${scenario.character.name}의 표정이 굳었다)`,
    };
  }

  const matched = RULES.filter((r) => r.re.test(text));
  let delta = matched.reduce((sum, r) => sum + r.delta, 0);
  if (text.length < 8) delta -= 8;
  else if (text.length >= 25) delta += 3;
  delta = normalizeDelta(delta === 0 ? -2 : delta);

  const reason =
    matched.length > 0
      ? `${matched.map((r) => r.label).join(", ")}이(가) 담겨 상대의 마음이 움직였어요.`
      : text.length < 8
        ? "답변이 너무 짧아 성의가 없다고 느껴졌어요."
        : "상대의 감정이나 해결책에 대한 언급이 부족했어요.";

  const reply =
    delta >= 10
      ? "…그렇게 말해 주니까 조금은 이해가 되네. 계속 얘기해 봐."
      : delta > 0
        ? "음, 무슨 말인지는 알겠어. 그런데 아직은 잘 모르겠어."
        : "그게 다야? 내 입장도 좀 생각해 줬으면 좋겠어.";

  return { delta, reason, reply };
}

export function demoEvaluate(history: ChatTurn[]): Evaluation {
  const userTurns = history.filter((t) => t.role === "user");
  const avgDelta = userTurns.reduce((s, t) => s + (t.delta ?? 0), 0) / Math.max(1, userTurns.length);
  const avgLen = userTurns.reduce((s, t) => s + t.content.length, 0) / Math.max(1, userTurns.length);
  const all = userTurns.map((t) => t.content).join(" ");
  const has = (re: RegExp) => (re.test(all) ? 12 : 0);

  const base = clamp(55 + avgDelta * 2, 20, 90);
  const scores = {
    logic: Math.round(clamp(base + has(/하겠|할게|방법|계획|때문|이유/), 0, 100)),
    context: Math.round(clamp(base + has(/그랬구나|힘들|속상|이해|마음|서운/), 0, 100)),
    expression: Math.round(clamp(base + (avgLen >= 25 ? 10 : -5) + has(/죄송|미안|고마/), 0, 100)),
  };
  const weakest = [...userTurns].sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))[0];

  return {
    scores,
    total: Math.round((scores.logic + scores.context + scores.expression) / 3),
    feedback: {
      strengths: "끝까지 대화를 이어 가며 상대에게 답하려고 노력했어요.",
      improvements: "상대의 감정을 먼저 짚고, 구체적인 해결책을 함께 말하면 더 좋아져요.",
    },
    betterAnswer: {
      original: weakest?.content ?? "(답변 없음)",
      improved: "그렇게 느꼈을 수 있겠다. 내가 부족했던 부분은 인정할게. 앞으로는 이렇게 해 볼게.",
      why: "감정 공감 → 책임 인정 → 구체적인 행동 순서로 말하면 상대가 마음을 열기 쉬워요.",
    },
  };
}

export function demoScenario(category: Category): Omit<Scenario, "id"> {
  const pool = SCENARIOS.filter((s) => s.category === category);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  // id는 서버에서 새로 붙여요.
  return { ...pick, title: `${pick.title} (데모 변형)` };
}

export function demoTini(profile: TiniProfile, lastMessage: string): string {
  const casual = profile.speechStyle === "casual";
  const topic = lastMessage.length > 20 ? `${lastMessage.slice(0, 20)}…` : lastMessage;
  return casual
    ? `"${topic}" 얘기구나. 그런 마음 들 수 있지. 너는 이 상황에서 제일 바라는 게 뭐야?`
    : `"${topic}" 이야기군요. 충분히 그렇게 느낄 수 있어요. 이 상황에서 가장 바라는 결과는 무엇인가요?`;
}
