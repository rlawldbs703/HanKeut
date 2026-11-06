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
    topic: "어린 시절의 나 (꿈, 좋아했던 놀이, 변하지 않은 취향)",
    theme: "house",
    width: 2000,
    intro: "낡은 별등이 흔들리는 집. 어딘가 익숙한 냄새가 난다.",
    spots: [
      { id: "h1", x: 520, lane: 0.3, label: "창가의 작은 의자", seed: "이 의자에 앉으니 어릴 적 꿈이 떠오를 것 같아. 어렸을 때 나는 어떤 사람이 되고 싶었더라?" },
      { id: "h2", x: 1150, lane: 0.7, label: "먼지 쌓인 장난감 상자", seed: "상자 안에 낡은 장난감이 가득해. 어릴 때 가장 좋아했던 놀이나 활동은 뭐였어?" },
    ],
    gate: { x: 1800, minigame: "fragments", label: "별의 집 문", story: "흩어진 별 조각 3개를 모으면 문이 열린다." },
  },
  {
    id: "garden",
    name: "잊혀진 정원",
    topic: "내가 좋아하는 것 (취향, 장소, 분위기)",
    theme: "garden",
    width: 2000,
    intro: "시든 꽃과 새 꽃이 함께 핀 정원. 오늘의 공기가 느껴진다.",
    spots: [
      { id: "g1", x: 520, lane: 0.35, label: "웃는 듯한 꽃", seed: "이 정원엔 좋아하는 것들이 꽃으로 피어난대. 요즘 내가 가장 좋아하는 건 뭐야?" },
      { id: "g2", x: 1150, lane: 0.65, label: "해 질 녘 벤치", seed: "이 벤치 같은 곳, 마음에 들어. 내가 좋아하는 장소나 분위기는 어떤 느낌이야?" },
    ],
    gate: { x: 1800, minigame: "light", label: "빛의 제단", story: "거울을 돌려 빛을 수정까지 이으면 길이 열린다." },
  },
  {
    id: "plain",
    name: "그림자 평원",
    topic: "나를 편안하게 만드는 것 (쉼, 나다운 순간)",
    theme: "plain",
    width: 2000,
    intro: "바람이 낮게 우는 평원. 그림자들이 마음의 무게처럼 떠돈다.",
    spots: [
      { id: "p1", x: 520, lane: 0.4, label: "홀로 선 나무", seed: "그림자 사이에서도 이 나무 아래는 이상하게 편안해. 나는 어떤 순간에 가장 편안함을 느껴?" },
      { id: "p2", x: 1150, lane: 0.6, label: "바람에 실린 편지 조각", seed: "편지 조각에 ‘오늘도 수고했어’라고 적혀 있어. 힘든 하루를 보낸 뒤 가장 하고 싶은 일은 뭐야?" },
    ],
    gate: { x: 1800, minigame: "shadow", label: "그림자 길", story: "그림자를 피해 빛이 남은 길로만 건너야 한다." },
  },
  {
    id: "attic",
    name: "시간의 다락",
    topic: "지금의 나와 미래의 나 (요즘의 시간, 도전, 행복한 삶)",
    theme: "attic",
    width: 2000,
    intro: "멈춘 시계와 아직 열지 않은 상자들. 앞으로의 시간이 쌓인 곳.",
    spots: [
      { id: "a1", x: 520, lane: 0.35, label: "빛바랜 지도", seed: "지도에 요즘 내가 다니는 길이 그려져 있어. 요즘 내가 가장 많은 시간을 쓰는 일은 뭐야?" },
      { id: "a2", x: 1150, lane: 0.65, label: "먼 미래의 거울", seed: "거울 속에 미래의 내가 보여. 그때의 나는 어떤 일을 하며 살아가고 있을까?" },
    ],
    gate: { x: 1800, minigame: "memory", label: "시간의 상자", story: "되찾은 기억을 순서대로 맞추면 상자가 열린다." },
  },
  {
    id: "hall",
    name: "별의 전당",
    topic: "나의 성격과 관계 (사람들 속의 나)",
    theme: "hall",
    width: 1700,
    intro: "모든 별빛이 모이는 전당. 이곳에서 나는 누구인지 알게 될 것 같다.",
    spots: [
      { id: "l1", x: 450, lane: 0.35, label: "별빛 초상화들", seed: "초상화들이 나를 보는 것 같아. 처음 만난 사람들은 나를 어떤 사람이라고 생각할까?" },
      { id: "l2", x: 900, lane: 0.65, label: "서로 이어진 별들", seed: "가까운 별끼리는 빛이 이어져 있네. 내가 사람들과 가까워질 때 중요하게 생각하는 건 뭐야?" },
    ],
    gate: { x: 1450, minigame: "constellation", label: "별자리 제단", story: "모은 별 조각으로 나의 별자리를 완성한다." },
  },
];

/** 지역별 질문 풀: LLM이 앞선 답과 연결해 자연스럽게 골라 쓰는 후보 (순서대로 묻지 않음, 답은 선택) */
export const POOLS: Record<string, string[]> = {
  house: ["시간 가는 줄 모르고 즐겼던 일", "어렸을 때부터 지금까지 변하지 않은 취향", "어린 시절의 나를 한 단어로 표현한다면"],
  garden: ["돈이나 시간에 제약이 없다면 해보고 싶은 것", "좋아하는 음악·음식·색깔·계절", "남들은 잘 모르지만 나만 좋아하는 것"],
  plain: ["혼자 있을 때와 함께 있을 때 중 언제 더 나다운지", "아무것도 하지 않아도 행복한 순간", "내가 가장 나답다고 느끼는 장소"],
  attic: ["지금 가장 배우거나 도전해 보고 싶은 것", "내가 생각하는 행복한 삶의 모습", "5년 뒤의 내가 지금의 나에게 고마워할 일"],
  hall: ["친한 사람들 앞에서만 드러나는 나의 모습", "내가 은근히 자신 있어 하는 부분", "다른 사람에게 어떤 사람으로 기억되고 싶은지"],
};
