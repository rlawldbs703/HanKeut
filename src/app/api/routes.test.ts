import { beforeEach, describe, expect, it, vi } from "vitest";
import { SCENARIOS } from "@/data/scenarios";
import { POST as evaluate } from "./battle/evaluate/route";
import { POST as turn } from "./battle/turn/route";
import { GET as health } from "./health/route";
import { POST as generate } from "./scenario/generate/route";
import { POST as tini } from "./tini/chat/route";

// 테스트에는 실제 요청이 없으므로 connection()을 빈 함수로 바꿔요.
vi.mock("next/server", () => ({ connection: async () => {} }));

const post = (body: unknown) =>
  new Request("http://localhost/api", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

beforeEach(() => {
  vi.stubEnv("TILON_API_BASE_URL", "");
  vi.stubEnv("TILON_MODEL", "");
  vi.stubEnv("TILON_API_KEY", "never-leak-this");
});

describe("API 라우트 (데모 모드)", () => {
  it("GET /api/health 는 상태만 알려 주고 키는 노출하지 않는다", async () => {
    const text = await (await health()).text();
    expect(JSON.parse(text)).toEqual({ source: "demo" });
    expect(text).not.toContain("never-leak-this");
  });

  it("POST /api/battle/turn 정상 요청", async () => {
    const res = await turn(post({ scenario: SCENARIOS[0], gauge: 30, history: [], userMessage: "미안해, 내일까지 할게" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("reply");
    expect(data).toHaveProperty("delta");
    expect(data).toHaveProperty("reason");
    expect(data.source).toBe("demo");
  });

  it("잘못된 요청은 400", async () => {
    expect((await turn(post("{깨진 json"))).status).toBe(400);
    expect((await turn(post({ scenario: SCENARIOS[0], gauge: 30, history: [], userMessage: "" }))).status).toBe(400);
    expect((await turn(post({ scenario: { id: "x" }, gauge: 30, history: [], userMessage: "hi" }))).status).toBe(400);
  });

  it("POST /api/battle/evaluate", async () => {
    const res = await evaluate(
      post({ scenario: SCENARIOS[0], history: [{ role: "user", content: "미안해", delta: 5, reason: "r" }], result: "won" })
    );
    const data = await res.json();
    expect(data.scores).toHaveProperty("logic");
    expect(data.betterAnswer.original).toBe("미안해");
  });

  it("POST /api/scenario/generate", async () => {
    const data = await (await generate(post({ category: "friend", focus: "context" }))).json();
    expect(data.scenario.category).toBe("friend");
    expect((await generate(post({ category: "game" }))).status).toBe(400);
  });

  it("POST /api/tini/chat", async () => {
    const res = await tini(
      post({
        profile: { name: "티니", personality: "warm", speechStyle: "polite" },
        messages: [{ role: "user", content: "발표가 걱정돼요" }],
      })
    );
    expect((await res.json()).reply).toBeTruthy();
  });
});
