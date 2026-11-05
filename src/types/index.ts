// 한끗차이에서 쓰는 데이터 모양을 한곳에 모아 둔 파일이에요.

/** 대화 상황 카테고리 */
export type Category = "school" | "work" | "friend" | "love";

/** AI 응답을 누가 만들었는지: 틸론 GPU 모델 또는 데모(규칙 기반) */
export type AiSource = "tilon" | "demo";

/** 대결 상대 캐릭터 */
export interface Character {
  name: string;
  role: string;
  emoji: string;
  personality: string;
}

/** 대결 시나리오 (기본 세트 또는 AI 생성) */
export interface Scenario {
  id: string;
  category: Category;
  title: string;
  situation: string;
  character: Character;
  mission: string;
  startGauge: number; // 시작 게이지 (0~100)
  goalGauge: number; // 이 값에 도달하면 승리
  maxTurns: number; // 사용자가 답할 수 있는 횟수
  openingLine: string; // 상대가 처음 하는 말
  isAiGenerated?: boolean;
}

/** 대화 한 줄 */
export interface ChatTurn {
  role: "user" | "opponent";
  content: string;
  delta?: number; // 사용자 답변으로 바뀐 게이지 (user만)
  reason?: string; // 게이지가 바뀐 근거 (user만)
}

export type BattleStatus = "playing" | "won" | "lost";

/** 진행 중인 대결 상태 */
export interface BattleState {
  gauge: number;
  turn: number; // 사용자가 답한 횟수
  status: BattleStatus;
  history: ChatTurn[];
}

/** AI가 한 턴을 판정한 결과 */
export interface TurnResult {
  reply: string;
  delta: number;
  reason: string;
}

/** 3대 역량 점수 (0~100) */
export interface Scores {
  logic: number; // 논리력
  context: number; // 상황 이해력
  expression: number; // 표현력
}

/** 대결 종료 후 AI 평가 */
export interface Evaluation {
  scores: Scores;
  total: number;
  feedback: { strengths: string; improvements: string };
  betterAnswer: { original: string; improved: string; why: string };
}

/** MY GROWTH에 저장되는 대결 기록 */
export interface BattleRecord {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  category: Category;
  result: "won" | "lost";
  finalGauge: number;
  turnsUsed: number;
  scores: Scores;
  total: number;
  createdAt: string; // ISO 날짜
  aiSource: AiSource;
}

/** MY MINI-TTINI 프로필 */
export interface TiniProfile {
  name: string;
  emoji: string;
  color: string;
  personality: "warm" | "realistic" | "cheerful";
  speechStyle: "casual" | "polite";
}

export interface TiniMessage {
  role: "user" | "tini";
  content: string;
}
