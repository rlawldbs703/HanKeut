import { describe, expect, it } from "vitest";
import { FIRST_QUESTION, POOLS, REGIONS } from "./regions";
import { SHADOW_START, checkOrder, moveInShadow, shadowAt } from "./minigames";

describe("지역 구성", () => {
  it("5개 지역, 관문마다 서로 다른 미니게임", () => {
    expect(REGIONS.map((r) => r.name)).toEqual(["별의 집", "잊혀진 정원", "그림자 평원", "시간의 다락", "별의 전당"]);
    expect(new Set(REGIONS.map((r) => r.gate.minigame)).size).toBe(5);
    expect(Object.keys(POOLS)).toEqual(REGIONS.map((r) => r.id));
    // 기획서의 25개 질문 = 지역별 첫 물음 10개 + 질문 풀 15개
    expect(REGIONS.flatMap((r) => r.spots).length + Object.values(POOLS).flat().length).toBe(25);
    expect(FIRST_QUESTION).toContain("나는 누구였을까");
  });

  it("질문은 설문형 '~어떤 사람?'이 아닌 풍경과 연결된 물음", () => {
    for (const s of REGIONS.flatMap((r) => r.spots)) expect(s.seed.endsWith("?")).toBe(true);
  });
});

describe("그림자 평원", () => {
  it("그림자는 경로를 왕복한다", () => {
    expect(shadowAt(0)[0]).toEqual([1, 0]);
    expect(shadowAt(4)[0]).toEqual([1, 4]);
    expect(shadowAt(5)[0]).toEqual([1, 3]);
  });

  it("그림자에 닿으면 처음으로, 출구에 닿으면 완료", () => {
    // step 0 → 1에서 그림자0은 (1,1). (0,2)→(1,2) 이동은 안전
    const safe = moveInShadow(SHADOW_START, 0, 1, 0);
    expect(safe.hit).toBe(false);
    // step 1 → 2에서 그림자0이 (1,2)로 오므로 제자리 머무르면 닿음
    expect(moveInShadow(safe.pos, safe.step, 0, 0).hit).toBe(true);
    expect(moveInShadow({ x: 4, y: 2 }, 3, 1, 0).done).toBe(true);
  });

  it("정답 경로가 존재한다", () => {
    let st = { pos: { ...SHADOW_START }, step: 0 };
    // 너비 우선 탐색으로 도달 가능 여부 확인
    const seen = new Set<string>();
    const q = [st];
    let found = false;
    while (q.length && !found) {
      st = q.shift()!;
      for (const [dx, dy] of [[1, 0], [0, 1], [0, -1], [-1, 0], [0, 0]]) {
        const m = moveInShadow(st.pos, st.step, dx, dy);
        if (m.done) found = true;
        const key = `${m.pos.x},${m.pos.y},${m.step % 24}`;
        if (!m.hit && !seen.has(key) && m.step < 60) {
          seen.add(key);
          q.push({ pos: m.pos, step: m.step });
        }
      }
    }
    expect(found).toBe(true);
  });
});

describe("순서 맞추기 (시간의 다락 / 별의 전당)", () => {
  it("맞으면 ok, 진행 중 partial, 틀리면 wrong", () => {
    expect(checkOrder([0, 1], [0, 1, 2])).toBe("partial");
    expect(checkOrder([0, 2], [0, 1, 2])).toBe("wrong");
    expect(checkOrder([0, 1, 2], [0, 1, 2])).toBe("ok");
  });
});
