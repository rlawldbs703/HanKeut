// 《별의 끝에서》 데모 대본과 맵 배치
// ★ = 원작 자료의 대사(변경 금지), ☆ = 교훈을 녹이기 위해 새로 쓴 대사(PRD-v2에 표기)

export type StageId = "house" | "garden";
export type Line = { speaker: "radio" | "me" | "memory" | "voice" | "system"; text: string };

export interface WorldObject {
  id: string;
  kind: "fragment" | "radio" | "door" | "memory" | "altar" | "shadow";
  x: number; // 가로 위치(px, 월드 좌표)
  lane: number; // 깊이 0(앞)~1(뒤) — 2.5D
  label: string;
  lines?: Line[];
}

export const WORLD_WIDTH: Record<StageId, number> = { house: 2400, garden: 2600 };

export const PROLOGUE: Line[] = [
  { speaker: "system", text: "희미한 별빛 속에서 눈을 떴다." },
  { speaker: "radio", text: "여기는 어디지? 나는 누구였을까?" }, // ★
  { speaker: "system", text: "←→ 이동 · ↑↓ 앞뒤 이동 · Space/E 살펴보기" },
];

export const HOUSE_OBJECTS: WorldObject[] = [
  {
    id: "f1",
    kind: "fragment",
    x: 520,
    lane: 0.2,
    label: "별 조각",
    lines: [{ speaker: "memory", text: "\"…오늘도 내 얘기만 들어 줬네. 너는 괜찮아?\"" }], // ☆
  },
  {
    id: "f2",
    kind: "fragment",
    x: 1080,
    lane: 0.8,
    label: "별 조각",
    lines: [{ speaker: "memory", text: "좋아하는 게 뭐냐고 물으면, 나는 늘 네가 좋아하는 걸 말했지." }], // ☆
  },
  {
    id: "f3",
    kind: "fragment",
    x: 1640,
    lane: 0.4,
    label: "별 조각",
    lines: [{ speaker: "memory", text: "다 나눠 주고 나면… 내 몫의 빛은 얼마나 남을까." }], // ☆
  },
  { id: "radio", kind: "radio", x: 1980, lane: 0.6, label: "낡은 라디오" },
  { id: "door", kind: "door", x: 2300, lane: 0.5, label: "정원으로 가는 문" },
];

export const RADIO_RESTORED: Line[] = [
  { speaker: "voice", text: "기억하고 있어? 그날의 별을." }, // ★
  { speaker: "voice", text: "별을 만들 땐… 네 빛도 조금은 남겨 둬. 남을 사랑하는 너 자신도…" }, // ☆ (뒷말은 엔딩에서 완성)
  { speaker: "system", text: "잡음이 목소리를 삼켰다. 문 너머에서 빛이 새어 나온다." },
];

export const GARDEN_OBJECTS: WorldObject[] = [
  {
    id: "m1",
    kind: "memory",
    x: 420,
    lane: 0.3,
    label: "빛바랜 꽃",
    lines: [{ speaker: "memory", text: "힘들다고 말해도 괜찮았는데. 왜 늘 괜찮다고만 했을까." }], // ☆
  },
  { id: "s1", kind: "shadow", x: 900, lane: 0.5, label: "그림자" },
  { id: "s2", kind: "shadow", x: 1400, lane: 0.5, label: "그림자" },
  {
    id: "m2",
    kind: "memory",
    x: 1750,
    lane: 0.7,
    label: "거울 조각",
    lines: [{ speaker: "memory", text: "거울은 빛을 남에게 돌려보내기만 해. 거울에 비친 나는… 어떤 얼굴이었지?" }], // ☆
  },
  { id: "altar", kind: "altar", x: 2150, lane: 0.5, label: "빛의 제단" },
];

export const GARDEN_FRAGMENT: Line[] = [
  { speaker: "me", text: "누군가를 위해 꼭 전해야 할 말이 있었던 것 같은데…" }, // ★
];

export const SHADOW_TOUCH: Line[] = [{ speaker: "me", text: "…차가워. 무언가를 잊어버린 것 같아." }]; // ☆

export const ENDING: Line[] = [
  { speaker: "system", text: "네 개의 별 조각이 하나로 모인다." },
  { speaker: "me", text: "이 빛… 전부 내 기억이었어." }, // ☆
  { speaker: "me", text: "나는 별을 전하러 온 게 아니라… 이미 별이 된 거였구나." }, // ☆ (정체 공개)
  { speaker: "voice", text: "…사랑해 줘." }, // ☆ 라디오에서 끊겼던 말의 완성
  { speaker: "system", text: "마지막 별이 하늘로 떠오르고, 아이의 몸이 빛으로 흩어진다." },
  { speaker: "me", text: "아직… 널 기억하고 있어." }, // ★ 마지막 대사
];

export const SPEAKER_LABEL: Record<Line["speaker"], string> = {
  radio: "📻 라디오",
  me: "별빛 아이",
  memory: "✦ 기억 조각",
  voice: "📻 그리운 목소리",
  system: "",
};
