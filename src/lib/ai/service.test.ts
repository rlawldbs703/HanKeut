import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SCENARIOS } from "@/data/scenarios";
import { buildTurnMessages } from "./prompts";
import { getAiStatus, runEvaluation, runScenarioGeneration, runTiniChat, runTurn } from "./service";

const scenario = SCENARIOS[2];
const turnInput = { scenario, gauge: 30, history: [], userMessage: "죄송합니다. 오늘 오후 3시까지 드릴게요." };

function mockAi(...contents: string[]) {
  const fetchMock = vi.fn();
  for (const c of contents) {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: c } }] }), { status: 200 })
    );
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("틸론 미설정 → 데모 모드", () => {
  beforeEach(() => {
    vi.stubEnv("TILON_API_BASE_URL", "");
    vi.stubEnv("TILON_MODEL", "");
  });

  it("턴 판정을 데모로 하고 source=demo를 알린다", async () => {
    const r = await runTurn(turnInput);
    expect(r.source).toBe("demo");
    expect(r.delta).toBeGreaterThan(0); // 사과 + 해결책
    expect(r.reason.length).toBeGreaterThan(0);
    expect(getAiStatus()).toEqual({ source: "demo" });
  });

  it("무례한 답변은 게이지가 내려간다", async () => {
    const r = await runTurn({ ...turnInput, userMessage: "아 몰라요 알아서 하세요" });
    expect(r.delta).toBeLessThan(0);
  });

  it("평가, 시나리오 생성, 티니 대화도 데모로 동작한다", async () => {
    const ev = await runEvaluation({
      scenario,
      history: [{ role: "user", content: "죄송합니다", delta: 6, reason: "r" }],
      result: "lost",
    });
    expect(ev.source).toBe("demo");
    expect(ev.total).toBeGreaterThan(0);

    const gen = await runScenarioGeneration({ category: "love" });
    expect(gen.scenario.id).toMatch(/^ai-/);
    expect(gen.scenario.category).toBe("love");

    const tini = await runTiniChat({
      profile: { name: "티니", emoji: "🐣", color: "#f9a8d4", personality: "warm", speechStyle: "casual" },
      messages: [{ role: "user", content: "친구랑 싸웠어" }],
    });
    expect(tini.reply).toContain("친구랑 싸웠어");
  });
});

describe("틸론 설정됨 → 실제 API 호출", () => {
  beforeEach(() => {
    vi.stubEnv("TILON_API_BASE_URL", "https://gpu.example.ac.kr/v1/");
    vi.stubEnv("TILON_MODEL", "test-model");
    vi.stubEnv("TILON_API_KEY", "secret-key");
  });

  it("OpenAI 호환 형식으로 호출하고 결과를 쓴다", async () => {
    const fetchMock = mockAi('{"reply":"알겠어요. 3시까지 꼭 주세요.","delta":12,"reason":"책임 인정과 마감 제시"}');
    const r = await runTurn(turnInput);

    expect(r).toMatchObject({ source: "tilon", delta: 12, reply: "알겠어요. 3시까지 꼭 주세요." });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://gpu.example.ac.kr/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer secret-key");
    expect(JSON.parse(init.body).model).toBe("test-model");
    expect(getAiStatus()).toEqual({ source: "tilon", model: "test-model" });
  });

  it("JSON 형식이 틀리면 한 번 더 요청한다", async () => {
    const fetchMock = mockAi("죄송해요 JSON을 못 만들었어요", '{"reply":"네","delta":3,"reason":"r"}');
    const r = await runTurn(turnInput);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(r.source).toBe("tilon");
  });

  it("서버 오류면 데모로 대체하고 이유를 알린다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("err", { status: 500 })));
    const r = await runTurn(turnInput);
    expect(r.source).toBe("demo");
    expect(r.fallbackReason).toBeTruthy();
  });

  it("생성된 시나리오의 턴 수는 서버가 5로 고정한다", async () => {
    mockAi(
      JSON.stringify({
        category: "school",
        title: "t",
        situation: "s",
        character: { name: "n", role: "r", emoji: "😀", personality: "p" },
        mission: "m",
        startGauge: 30,
        goalGauge: 75,
        openingLine: "o",
        maxTurns: 99,
      })
    );
    const r = await runScenarioGeneration({ category: "school", focus: "logic" });
    expect(r.source).toBe("tilon");
    expect(r.scenario.maxTurns).toBe(5);
    expect(r.scenario.isAiGenerated).toBe(true);
  });
});

describe("프롬프트", () => {
  it("턴 프롬프트에 캐릭터·미션·게이지와 대화 기록이 들어간다", () => {
    const msgs = buildTurnMessages(scenario, 42, [{ role: "opponent", content: scenario.openingLine }], "답");
    expect(msgs[0].content).toContain(scenario.character.name);
    expect(msgs[0].content).toContain(scenario.mission);
    expect(msgs[0].content).toContain("42/100");
    expect(msgs.map((m) => m.role)).toEqual(["system", "assistant", "user"]);
  });
});
