import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as develop } from "@/app/api/create/develop/route";
import { POST as twist } from "@/app/api/create/twist/route";
import { extractElements, mockDevelop, mockTwists } from "./mock";
import type { Idea } from "./types";

const idea: Idea = { title: "별빛 탐험", genre: "탐험 퍼즐", world: "꺼져 가는 별들의 바다", character: "길 잃은 소녀", story: "마지막 별을 찾아 떠난다" };
const post = (body: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.stubEnv("TILON_API_BASE_URL", "");
  vi.stubEnv("TILON_MODEL", "");
});

describe("공동 창작 체험 모드", () => {
  it("입력에서 핵심 요소를 뽑는다", () => {
    const el = extractElements(idea);
    expect(el[0]).toBe("별빛 탐험");
    expect(el.length).toBeGreaterThan(2);
  });

  it("서로 다른 방향의 제안 3개, 이미 고른 방향은 피한다", () => {
    const first = mockTwists(idea, [], () => 0);
    expect(new Set(first.map((t) => t.axis)).size).toBe(3);
    const step = { chosen: first[0], userEdit: "", result: "r" };
    const next = mockTwists(idea, [step], () => 0);
    expect(next.map((t) => t.axis)).not.toContain(first[0].axis);
    expect(next[0].pitch).toContain(first[0].title);
  });

  it("발전 결과에 창작자의 수정이 반영된다", () => {
    const [t] = mockTwists(idea, []);
    const r = mockDevelop(idea, [], t, "소녀가 별을 직접 만든다");
    expect(r.result).toContain("소녀가 별을 직접 만든다");
    expect(r.nextQuestion.length).toBeGreaterThan(0);
  });
});

describe("API", () => {
  it("TWIST는 3개 + source=demo", async () => {
    const d = await (await twist(post({ idea, steps: [] }))).json();
    expect(d.twists).toHaveLength(3);
    expect(d.source).toBe("demo");
  });

  it("CREATE는 결과와 다음 질문을 준다, 잘못된 요청은 400", async () => {
    const t = mockTwists(idea, [])[0];
    const d = await (await develop(post({ idea, steps: [], chosen: t, userEdit: "" }))).json();
    expect(d.result).toContain(t.axis);
    expect((await develop(post({ idea: { title: "" }, steps: [] }))).status).toBe(400);
  });
});
