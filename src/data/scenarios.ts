import type { Category, Scenario } from "@/types";

export const CATEGORY_LABELS: Record<Category, string> = {
  school: "학교",
  work: "회사",
  friend: "친구",
  love: "연인",
};

export const CATEGORIES: Category[] = ["school", "work", "friend", "love"];

// 직접 다듬은 기본 시나리오예요. 시연할 때 안정적으로 쓰기 위한 세트예요.
export const SCENARIOS: Scenario[] = [
  {
    id: "school-free-rider",
    category: "school",
    title: "조별과제 무임승차 조원",
    situation:
      "발표가 이틀 남았는데 조원 민준이가 맡은 자료 조사를 하나도 안 했다. 단톡방에서 개인적으로 연락하자 민준이가 방어적으로 나온다.",
    character: {
      name: "민준",
      role: "같은 조 조원",
      emoji: "😒",
      personality: "자존심이 세고 지적받으면 방어적이지만, 진심으로 존중받으면 협조한다",
    },
    mission: "민준이 기분을 상하게 하지 않으면서 내일까지 자료를 받기로 약속받기",
    startGauge: 30,
    goalGauge: 75,
    maxTurns: 5,
    openingLine: "아 왜 또 연락했어? 나도 요즘 알바 때문에 바쁘다고 했잖아.",
  },
  {
    id: "school-professor-grade",
    category: "school",
    title: "교수님께 성적 문의하기",
    situation:
      "기말 성적이 예상보다 낮게 나와 교수님 연구실을 찾아갔다. 교수님은 바빠 보이고 성적 문의를 반기지 않는 눈치다.",
    character: {
      name: "박 교수님",
      role: "전공 교수",
      emoji: "🧐",
      personality: "원칙을 중시하고 근거 없는 요청을 싫어하지만, 예의 바르고 구체적인 질문에는 성실히 답한다",
    },
    mission: "무례하지 않게 채점 기준을 듣고 재확인을 약속받기",
    startGauge: 35,
    goalGauge: 75,
    maxTurns: 5,
    openingLine: "성적 때문에 왔나요? 미리 말하지만 점수 올려 달라는 얘기라면 곤란합니다.",
  },
  {
    id: "work-late-report",
    category: "work",
    title: "마감 늦은 보고서",
    situation:
      "어제까지 제출하기로 한 주간 보고서를 아직 내지 못했다. 아침에 김팀장이 자리로 찾아왔다.",
    character: {
      name: "김팀장",
      role: "직속 상사",
      emoji: "😠",
      personality: "책임감이 강하고 변명을 싫어하지만, 책임을 인정하고 해결책을 내는 사람은 신뢰한다",
    },
    mission: "변명 없이 책임을 인정하고 구체적인 해결책으로 신뢰 회복하기",
    startGauge: 30,
    goalGauge: 70,
    maxTurns: 5,
    openingLine: "보고서 어제까지라고 했잖아요. 지금 어떻게 된 거예요?",
  },
  {
    id: "work-overtime-request",
    category: "work",
    title: "갑작스러운 야근 요청 거절하기",
    situation:
      "오늘 저녁 가족 행사가 있는데 퇴근 30분 전, 선배가 급한 일이라며 같이 야근하자고 한다.",
    character: {
      name: "이선배",
      role: "같은 팀 선배",
      emoji: "😅",
      personality: "부탁을 자주 하지만 나쁜 사람은 아니며, 대안을 제시하면 받아들인다",
    },
    mission: "관계를 해치지 않으면서 오늘 야근을 정중히 거절하고 대안 제시하기",
    startGauge: 40,
    goalGauge: 75,
    maxTurns: 5,
    openingLine: "미안한데 오늘 이거 같이 좀 끝내고 가자. 내일 아침까지 넘겨야 하거든.",
  },
  {
    id: "friend-cancel-again",
    category: "friend",
    title: "약속을 또 취소한 친구",
    situation:
      "한 달 전부터 잡은 약속을 친구 서연이가 당일에 또 취소했다. 이번이 세 번째다.",
    character: {
      name: "서연",
      role: "10년 지기 친구",
      emoji: "🙏",
      personality: "미안해하면서도 서운함을 표현하면 쉽게 상처받는다. 솔직하고 따뜻한 말에 마음을 연다",
    },
    mission: "서운한 마음을 솔직하게 전하면서 우정은 지키고 다음 약속 확정하기",
    startGauge: 45,
    goalGauge: 80,
    maxTurns: 5,
    openingLine: "진짜 미안해… 오늘 갑자기 일이 생겨서 못 갈 것 같아. 화났어?",
  },
  {
    id: "friend-money-borrow",
    category: "friend",
    title: "돈 빌려 달라는 친구",
    situation:
      "지난번 빌려준 돈도 아직 못 받았는데, 친구 도윤이가 또 50만 원을 빌려 달라고 한다.",
    character: {
      name: "도윤",
      role: "대학 동기",
      emoji: "🥺",
      personality: "급하면 감정에 호소하지만, 명확한 기준을 말하면 이해하는 편이다",
    },
    mission: "친구 관계를 지키면서 이번 부탁은 분명하게 거절하기",
    startGauge: 40,
    goalGauge: 75,
    maxTurns: 5,
    openingLine: "야 진짜 이번 한 번만 50만 원만 빌려주라. 다음 달에 꼭 같이 갚을게.",
  },
  {
    id: "love-late-reply",
    category: "love",
    title: "답장이 늦어 서운한 연인",
    situation:
      "회의가 길어져 반나절 동안 연인 지아의 메시지에 답하지 못했다. 저녁에 확인해 보니 지아가 서운해하고 있다.",
    character: {
      name: "지아",
      role: "연인",
      emoji: "😔",
      personality: "변명보다 공감을 원하고, 마음을 알아주면 금방 풀린다",
    },
    mission: "변명 대신 지아의 서운함에 공감하고 마음 풀어 주기",
    startGauge: 35,
    goalGauge: 80,
    maxTurns: 5,
    openingLine: "하루 종일 연락 한 통이 없네. 나만 기다린 거야?",
  },
  {
    id: "love-anniversary-forgot",
    category: "love",
    title: "기념일을 잊어버렸다",
    situation:
      "오늘이 사귄 지 100일인데 깜빡하고 평소처럼 지냈다. 연인 현우가 차갑게 메시지를 보냈다.",
    character: {
      name: "현우",
      role: "연인",
      emoji: "🥶",
      personality: "실망하면 말수가 줄지만, 진심 어린 사과와 구체적인 행동 약속에 마음을 연다",
    },
    mission: "진심으로 사과하고 실망한 마음을 회복시키기",
    startGauge: 25,
    goalGauge: 70,
    maxTurns: 5,
    openingLine: "오늘 무슨 날인지 알아?",
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function getScenariosByCategory(category: Category): Scenario[] {
  return SCENARIOS.filter((s) => s.category === category);
}
