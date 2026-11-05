// 대결 규칙(게이지, 턴, 승패)만 담당하는 순수 함수 모음이에요.
// 화면이나 AI와 분리되어 있어서 테스트하기 쉬워요.
import type { BattleState, Scenario, TurnResult } from "@/types";

export const DELTA_MIN = -20;
export const DELTA_MAX = 20;
export const MESSAGE_MIN_LENGTH = 2;
export const MESSAGE_MAX_LENGTH = 300;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** AI가 준 게이지 변화량을 허용 범위의 정수로 맞춰요. */
export function normalizeDelta(delta: number): number {
  if (!Number.isFinite(delta)) return 0;
  return Math.round(clamp(delta, DELTA_MIN, DELTA_MAX));
}

/** 시나리오로 새 대결을 시작해요. 상대의 첫 마디가 대화에 들어가요. */
export function createBattle(scenario: Scenario): BattleState {
  return {
    gauge: scenario.startGauge,
    turn: 0,
    status: "playing",
    history: [{ role: "opponent", content: scenario.openingLine }],
  };
}

/** 사용자 입력이 보낼 수 있는 상태인지 검사해요. 문제가 있으면 안내 문구를 돌려줘요. */
export function validateUserMessage(message: string): string | null {
  const trimmed = message.trim();
  if (trimmed.length < MESSAGE_MIN_LENGTH) return "답변을 조금 더 적어 주세요.";
  if (trimmed.length > MESSAGE_MAX_LENGTH)
    return `답변은 ${MESSAGE_MAX_LENGTH}자 이내로 적어 주세요.`;
  return null;
}

/** 사용자 답변 + AI 판정 결과를 반영해 다음 상태를 만들어요. (원래 상태는 바꾸지 않아요) */
export function applyTurn(
  state: BattleState,
  scenario: Scenario,
  userMessage: string,
  result: TurnResult
): BattleState {
  if (state.status !== "playing") return state;

  const delta = normalizeDelta(result.delta);
  const gauge = clamp(state.gauge + delta, 0, 100);
  const turn = state.turn + 1;

  let status: BattleState["status"] = "playing";
  if (gauge >= scenario.goalGauge) status = "won";
  else if (gauge <= 0 || turn >= scenario.maxTurns) status = "lost";

  return {
    gauge,
    turn,
    status,
    history: [
      ...state.history,
      { role: "user", content: userMessage.trim(), delta, reason: result.reason },
      { role: "opponent", content: result.reply },
    ],
  };
}

export function turnsLeft(state: BattleState, scenario: Scenario): number {
  return Math.max(0, scenario.maxTurns - state.turn);
}
