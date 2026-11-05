// 《별의 끝에서》 여행 지역과 질문 배치
export type Theme = "house" | "garden" | "lake" | "hill" | "gate";

export interface Spot {
  id: string;
  x: number;
  lane: number;
  label: string;
  questions: string[]; // 순서대로 묻고, 답마다 별의 아이가 반응해요
}

export interface Region {
  id: string;
  name: string;
  topic: string; // AI에게 알려 줄 대화 주제
  theme: Theme;
  width: number;
  intro: string[]; // 지역에 들어설 때 별의 아이의 말
  spots: Spot[];
}

export const FIRST_QUESTION = "안녕! 먼저, 당신은 누구인가요?";

export const REGIONS: Region[] = [
  {
    id: "childhood",
    name: "어린 별의 방",
    topic: "어린 시절의 기억",
    theme: "house",
    width: 1800,
    intro: ["여긴 오래된 별빛이 모이는 방이야.", "빛나는 곳에 가 보면, 네 어린 시절 이야기가 떠오를지도 몰라."],
    spots: [
      { id: "c1", x: 560, lane: 0.35, label: "작은 별빛", questions: ["어렸을 때의 나는 어떤 아이였어?", "그때 가장 좋아했던 것은 뭐였어?"] },
      { id: "c2", x: 1180, lane: 0.65, label: "낡은 그림책", questions: ["어릴 때의 내가 지금의 나를 본다면 뭐라고 할까?"] },
    ],
  },
  {
    id: "now",
    name: "오늘의 정원",
    topic: "지금의 나",
    theme: "garden",
    width: 1900,
    intro: ["이번엔 지금의 너를 닮은 정원이야.", "꽃마다 오늘의 네 이야기가 숨어 있을 것 같아."],
    spots: [
      { id: "n1", x: 560, lane: 0.3, label: "피어나는 꽃", questions: ["지금의 나는 어떤 사람인 것 같아?", "예전과 비교해서 달라진 점이 있어?"] },
      { id: "n2", x: 1260, lane: 0.7, label: "흔들리는 꽃", questions: ["요즘 가장 좋아하는 것은 뭐야?", "요즘 나를 가장 힘들게 하는 건 뭐야?"] },
    ],
  },
  {
    id: "heart",
    name: "마음의 호수",
    topic: "나의 감정과 관계",
    theme: "lake",
    width: 1900,
    intro: ["여긴 조용한 호수야. 물에 비친 마음은 숨기기 어렵대.", "천천히 이야기해도 괜찮아."],
    spots: [
      { id: "h1", x: 560, lane: 0.4, label: "물에 비친 빛", questions: ["다른 사람에게는 말하지 못했던 마음이 있어?", "힘들 때 나는 어떻게 쉬어?"] },
      { id: "h2", x: 1260, lane: 0.6, label: "잔잔한 물결", questions: ["누군가에게 가장 듣고 싶은 말은 뭐야?", "다른 사람을 챙기느라 나를 놓친 적은 없어?"] },
    ],
  },
  {
    id: "dream",
    name: "꿈의 언덕",
    topic: "나의 꿈과 미래",
    theme: "hill",
    width: 1900,
    intro: ["언덕 너머로 아직 오지 않은 날들이 보여.", "네가 가고 싶은 곳을 들려줘."],
    spots: [
      { id: "d1", x: 560, lane: 0.35, label: "떠오르는 별", questions: ["앞으로 꼭 해보고 싶은 일이 있어?", "두려워도 도전하고 싶은 것은 뭐야?"] },
      { id: "d2", x: 1260, lane: 0.65, label: "언덕 위 등불", questions: ["미래의 나는 어떤 모습이면 좋겠어?", "지금의 내가 미래의 나에게 꼭 전하고 싶은 말은?"] },
    ],
  },
  {
    id: "gate",
    name: "마지막 관문",
    topic: "작별",
    theme: "gate",
    width: 1400,
    intro: ["저기 빛나는 문이 보여? 여행의 끝이야."],
    spots: [],
  },
];

export const ALL_QUESTIONS = REGIONS.flatMap((r) => r.spots.flatMap((s) => s.questions));
