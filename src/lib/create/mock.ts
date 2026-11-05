// 체험 모드(임시 로직): 실제 AI가 아니라 규칙과 템플릿으로 제안을 만들어요.
import type { CreationStep, DevelopResult, Idea, Twist } from "./types";

type Rng = () => number;

/** 입력에서 핵심 요소(짧은 키워드)를 뽑아요. */
export function extractElements(idea: Idea): string[] {
  const text = [idea.world, idea.character, idea.story].join(" ");
  const words = text
    .split(/[\s,.!?·/()"'“”]+/)
    .map((w) => w.replace(/(은|는|이|가|을|를|의|에|에서|와|과|로|으로|도|만)$/, ""))
    .filter((w) => w.length >= 2);
  const uniq = [...new Set(words)];
  return [idea.title, ...(idea.genre ? [idea.genre] : []), ...uniq].slice(0, 6);
}

const AXES: { axis: string; make: (k: string, idea: Idea) => Omit<Twist, "axis"> }[] = [
  {
    axis: "관점 전환",
    make: (k) => ({
      title: `${k}의 시점으로 다시 보기`,
      pitch: `주인공이 아니라 '${k}'의 입장에서 같은 사건을 보여 주면 어떨까요? 플레이어는 나중에야 두 시점이 이어진다는 걸 알게 돼요.`,
      whyDifferent: "같은 이야기를 다른 인물의 눈으로 보게 해 반전을 만들어요.",
    }),
  },
  {
    axis: "규칙으로 만들기",
    make: (k) => ({
      title: `'${k}'을(를) 게임 규칙으로`,
      pitch: `'${k}'을(를) 설정에만 두지 말고 플레이 규칙으로 만들어 보세요. 예를 들어 ${k}에 가까워질수록 화면이나 조작이 달라지는 식이에요.`,
      whyDifferent: "이야기 요소를 플레이어가 직접 느끼는 메커니즘으로 바꿔요.",
    }),
  },
  {
    axis: "감정 반전",
    make: (k, idea) => ({
      title: `따뜻함과 상실 사이`,
      pitch: `${idea.title}의 분위기를 한 번 뒤집어 보세요. '${k}'이(가) 사실은 지키고 싶은 무언가였다면, 목표를 이루는 순간 무엇을 잃게 될까요?`,
      whyDifferent: "목표 달성을 단순한 승리가 아니라 선택의 대가로 바꿔요.",
    }),
  },
  {
    axis: "제약 추가",
    make: (k) => ({
      title: `말할 수 없는 ${k}`,
      pitch: `'${k}'에 제약을 하나 걸어 보세요. 예를 들어 대사 없이 행동과 환경만으로 의도를 전해야 한다면, 퍼즐과 연출이 훨씬 독특해져요.`,
      whyDifferent: "제약이 새로운 표현 방법과 퍼즐 아이디어를 만들어요.",
    }),
  },
  {
    axis: "세계 확장",
    make: (k) => ({
      title: `${k} 너머의 장소`,
      pitch: `'${k}'과(와) 정반대 성격의 장소를 하나 추가해 보세요. 두 공간을 오가며 플레이어가 차이를 비교하게 만들 수 있어요.`,
      whyDifferent: "대비되는 공간으로 탐험의 이유와 동선을 만들어요.",
    }),
  },
];

function pick<T>(arr: T[], n: number, rng: Rng): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  return out;
}

/** 서로 다른 방향의 제안 3개. 이미 고른 방향은 피하고, 마지막 선택 내용을 반영해요. */
export function mockTwists(idea: Idea, steps: CreationStep[], rng: Rng = Math.random): Twist[] {
  const used = new Set(steps.map((s) => s.chosen.axis));
  const pool = AXES.filter((a) => !used.has(a.axis));
  const axes = pick(pool.length >= 3 ? pool : AXES, 3, rng);
  const keys = extractElements(idea).slice(1);
  const last = steps.at(-1);
  return axes.map((a, i) => {
    const key = keys[i % Math.max(1, keys.length)] ?? idea.title;
    const twist = { axis: a.axis, ...a.make(key, idea) };
    if (last) twist.pitch = `지난 선택('${last.chosen.title}')에 이어서, ${twist.pitch}`;
    return twist;
  });
}

/** 사람이 고르고 고친 내용을 반영해 아이디어를 한 단계 발전시켜요. */
export function mockDevelop(idea: Idea, steps: CreationStep[], chosen: Twist, userEdit: string): DevelopResult {
  const base = steps.at(-1)?.result ?? [idea.world, idea.character, idea.story].filter(Boolean).join(" ");
  const edit = userEdit.trim();
  const result = [
    `【${idea.title} · ${steps.length + 1}차 발전】`,
    base ? `기존: ${base.slice(0, 160)}${base.length > 160 ? "…" : ""}` : "",
    `추가된 방향(${chosen.axis}): ${chosen.pitch}`,
    edit ? `창작자의 수정: ${edit}` : "창작자의 수정: (제안을 그대로 채택)",
    `→ 정리: '${chosen.title}'을(를) 중심으로, ${edit ? "창작자가 고친 방향을 우선해" : "제안을 바탕으로"} 장면과 플레이를 구체화해요.`,
  ]
    .filter(Boolean)
    .join("\n");
  const questions = [
    "이 변화가 플레이어에게 처음 드러나는 장면은 어디일까요?",
    "이 설정 때문에 생기는 퍼즐이나 선택지가 있을까요?",
    "주인공은 이 변화를 어떻게 받아들이나요?",
  ];
  return { result, nextQuestion: questions[steps.length % questions.length] };
}
