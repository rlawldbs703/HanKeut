// 라디오 주파수 퍼즐: 주파수를 맞출수록 과거의 목소리가 또렷해져요.
export const RADIO_MIN = 88;
export const RADIO_MAX = 108;
export const RADIO_TARGET = 97.3;
export const RADIO_TOLERANCE = 0.3; // 이 범위 안이면 '맞춤'

/** 선명도 0~1 */
export function clarity(freq: number, target = RADIO_TARGET): number {
  return Math.max(0, Math.min(1, 1 - Math.abs(freq - target) / 4));
}

export const isTuned = (freq: number, target = RADIO_TARGET) => Math.abs(freq - target) <= RADIO_TOLERANCE;

/** 선명도에 따라 글자를 잡음(·)으로 가려요. 같은 글자는 항상 같은 순서로 드러나요. */
export function garble(text: string, c: number): string {
  if (c >= 0.97) return text;
  return [...text]
    .map((ch, i) => {
      if (ch === " " || /[.,…?!"]/.test(ch)) return ch;
      const threshold = ((i * 37) % 100) / 100; // 글자마다 드러나는 순서
      return c > threshold ? ch : "·";
    })
    .join("");
}
