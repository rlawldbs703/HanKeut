import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as letter } from "@/app/api/journey/letter/route";
import { POST as reply } from "@/app/api/journey/reply/route";

const post = (b: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(b) });
const history = [
  { region: "별의 집", question: "어릴 적 가장 오래 머물고 싶었던 곳은?", answer: "할머니 집 다락방", reply: "" },
  { region: "잊혀진 정원", question: "요즘 나를 웃게 만드는 작은 일은?", answer: "고양이 사진", reply: "" },
];
const req = { regionId: "garden", topic: "지금의 나", question: "q", answer: "고양이 사진 보는 거", turnInSpot: 0, history };
const llm = (content: string) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content } }] })));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LLM 미연결", () => {
  beforeEach(() => {
    vi.stubEnv("TILON_API_BASE_URL", "");
    vi.stubEnv("LLM_API_BASE_URL", "");
  });

  it("대사를 꾸며 내지 않고 503 + 안내", async () => {
    const res = await reply(post(req));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("연결되지 않았어요");
    expect((await letter(post({ history }))).status).toBe(503);
  });

  it("잘못된 요청은 400", async () => {
    expect((await letter(post({ history: [] }))).status).toBe(400);
  });
});

describe("LLM 연결 시", () => {
  beforeEach(() => {
    vi.stubEnv("TILON_API_BASE_URL", "");
    vi.stubEnv("LLM_API_BASE_URL", "https://llm.example/v1");
    vi.stubEnv("LLM_MODEL", "m");
  });

  it("이전 기억을 문맥으로 보내고, LLM이 만든 다음 물음을 돌려준다", async () => {
    const fetchMock = llm('{"reply":"다락방에서처럼 작은 것에서 행복을 찾는구나.","followUp":"그 사진을 볼 때 마음은 어디에 가 있을까?"}');
    vi.stubGlobal("fetch", fetchMock);
    const d = await (await reply(post(req))).json();
    expect(d).toMatchObject({ source: "llm", followUp: "그 사진을 볼 때 마음은 어디에 가 있을까?" });
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body).messages;
    expect(sent[1].content).toContain("할머니 집 다락방");
    expect(sent[0].content).toContain("나다워질까"); // 지역 힌트 전달
  });

  it("LLM 실패 시 502 + 재시도 안내", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("x", { status: 500 })));
    const res = await reply(post(req));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("다시 시도");
  });

  it("편지: 사실/발견 분리", async () => {
    vi.stubGlobal("fetch", llm('{"facts":["할머니 집 다락방을 좋아했다"],"discoveries":["작은 공간을 아끼는 것처럼 보였어"],"letter":"안녕, 별의 아이야."}'));
    const d = await (await letter(post({ history }))).json();
    expect(d.facts).toHaveLength(1);
    expect(d.source).toBe("llm");
  });
});

describe("예비 모델", () => {
  it("기본 모델이 429면 다음 모델로 응답한다", async () => {
    vi.stubEnv("TILON_API_BASE_URL", "");
    vi.stubEnv("LLM_API_BASE_URL", "https://llm.example/v1");
    vi.stubEnv("LLM_MODEL", "main");
    vi.stubEnv("LLM_FALLBACK_MODELS", "backup");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("quota", { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: '{"reply":"예비 모델 응답","followUp":null}' } }] })));
    vi.stubGlobal("fetch", fetchMock);
    const d = await (await reply(post(req))).json();
    expect(d.reply).toBe("예비 모델 응답");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).model).toBe("backup");
  });
});
