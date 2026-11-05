// 《별의 끝에서》 — 플레이어 = 기억을 잃은 별의 아이. 지역마다 기억의 실마리(간접 질문)와 관문 미니게임.
export type Theme = "house" | "garden" | "plain" | "attic" | "hall";
export type Minigame = "fragments" | "light" | "shadow" | "memory" | "constellation";

export interface Spot {
  id: string;
  x: number;
  lane: number;
  label: string; // 풍경 속 오브젝트
  seed: string; // 오브젝트를 보며 떠오르는 첫 물음 (이후는 LLM이 맥락에 맞게 이어감)
}

export interface Region {
  id: string;
  name: string;
  topic: string; // LLM에게 알려 줄 기억의 주제
  theme: Theme;
  width: number;
  intro: string;
  spots: Spot[];
  gate: { x: number; minigame: Minigame; label: string; story: string };
}

export const FIRST_QUESTION = "…여긴 어디지? 나는 누구였을까. 떠오르는 대로, 나에 대해 말해 볼까?";

export const REGIONS: Region[] = [
  {
    id: "house",
    name: "별의 집",
    topic: "어린 시절의 기억",
    theme: "house",
    width: 2000,
    intro: "낡은 별등이 흔들리는 집. 어딘가 익숙한 냄새가 난다.",
    spots: [
      { id: "h1", x: 520, lane: 0.3, label: "창가의 작은 의자", seed: "이 창가… 어릴 적 가장 오래 머물고 싶었던 곳은 어디였을까?" },
      { id: "h2", x: 1150, lane: 0.7, label: "먼지 쌓인 장난감 상자", seed: "그때는 무엇만 있으면 하루 종일 행복했을까?" },
    ],
    gate: { x: 1800, minigame: "fragments", label: "별의 집 문", story: "흩어진 별 조각 3개를 모으면 문이 열린다." },
  },
  {
    id: "garden",
    name: "잊혀진 정원",
    topic: "지금의 나",
    theme: "garden",
    width: 2000,
    intro: "시든 꽃과 새 꽃이 함께 핀 정원. 오늘의 공기가 느껴진다.",
    spots: [
      { id: "g1", x: 520, lane: 0.35, label: "웃는 듯한 꽃", seed: "이 꽃처럼… 요즘 나를 웃게 만드는 작은 일은 무엇일까?" },
      { id: "g2", x: 1150, lane: 0.65, label: "해 질 녘 벤치", seed: "하루가 끝나면 가장 먼저 떠오르는 생각은 뭘까?" },
    ],
    gate: { x: 1800, minigame: "light", label: "빛의 제단", story: "거울을 돌려 빛을 수정까지 이으면 길이 열린다." },
  },
  {
    id: "plain",
    name: "그림자 평원",
    topic: "나의 감정과 관계",
    theme: "plain",
    width: 2000,
    intro: "바람이 낮게 우는 평원. 그림자들이 마음의 무게처럼 떠돈다.",
    spots: [
      { id: "p1", x: 520, lane: 0.4, label: "홀로 선 나무", seed: "마음이 무거운 날이면… 나는 어디로 가고 싶을까?" },
      { id: "p2", x: 1150, lane: 0.6, label: "바람에 실린 편지 조각", seed: "누군가 나에게 건네줬으면 하는 말은 뭐였을까?" },
    ],
    gate: { x: 1800, minigame: "shadow", label: "그림자 길", story: "그림자를 피해 빛이 남은 길로만 건너야 한다." },
  },
  {
    id: "attic",
    name: "시간의 다락",
    topic: "나의 꿈과 미래",
    theme: "attic",
    width: 2000,
    intro: "멈춘 시계와 아직 열지 않은 상자들. 앞으로의 시간이 쌓인 곳.",
    spots: [
      { id: "a1", x: 520, lane: 0.35, label: "빛바랜 지도", seed: "아직 가보지 못한 곳 중 꼭 가보고 싶은 곳은 어디일까?" },
      { id: "a2", x: 1150, lane: 0.65, label: "먼 미래의 거울", seed: "거울 속 미래의 나는… 어떤 표정을 짓고 있을까?" },
    ],
    gate: { x: 1800, minigame: "memory", label: "시간의 상자", story: "되찾은 기억을 순서대로 맞추면 상자가 열린다." },
  },
  {
    id: "hall",
    name: "별의 전당",
    topic: "되찾은 나",
    theme: "hall",
    width: 1500,
    intro: "모든 별빛이 모이는 전당. 이곳에서 나는 누구인지 알게 될 것 같다.",
    spots: [],
    gate: { x: 1050, minigame: "constellation", label: "별자리 제단", story: "모은 별 조각으로 나의 별자리를 완성한다." },
  },
];

/** LLM이 대화를 이어 갈 때 참고하는 지역별 남은 물음 (고정 질문으로 바로 쓰지 않음) */
export const HINTS: Record<string, string> = {
  house: "예전의 나에게 지금의 내가 찾아간다면 어떤 이야기를 들려줄까",
  garden: "요즘 나는 어떤 순간에 가장 나다워질까",
  plain: "다른 사람에게는 잘해 주면서 나에게는 아끼고 있는 것이 있을까",
  attic: "지금의 내가 미래의 나에게 남기고 싶은 별빛은",
};
