import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as letter } from "@/app/api/journey/letter/route";
import { POST as reply } from "@/app/api/journey/reply/route";
import { ALL_QUESTIONS, FIRST_QUESTION, REGIONS } from "./regions";
import { fallbackLetter } from "./service";

const post = (b: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(b) });
const history = [
  { region: "어린 별의 방", question: "어렸을 때의 나는 어떤 아이였어?", answer: "소심했어", reply: "" },
  { region: "오늘의 정원", question: "예전과 비교해서 달라진 점이 있어?", answer: "지금은 좀 활발해졌어", reply: "" },
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("지역·질문 구성", () => {
  it("4개 지역 + 마지막 관문, 기획서의 15개 질문이 모두 배치", () => {
    expect(REGIONS.map((r) => r.id)).toEqual(["childhood", "now", "heart", "dream", "gate"]);
    expect(ALL_QUESTIONS).toHaveLength(15);
    expect(ALL_QUESTIONS).toContain("다른 사람을 챙기느라 나를 놓친 적은 없어?");
    expect(FIRST_QUESTION).toBe("안녕! 먼저, 당신은 누구인가요?");
  });
});

describe("AI 미연결", () => {
  beforeEach(() => {
    vi.stubEnv("TILON_API_BASE_URL", "");
    vi.stubEnv("LLM_API_BASE_URL", "");
  });

  it("반응은 꾸며 낸 공감 없이 짧게, source=demo", async () => {
    const d = await (await reply(post({ topic: "t", question: "q", answer: "a", history: [] }))).json();
    expect(d.source).toBe("demo");
    expect(d.followUp).toBeNull();
  });

  it("기본 편지는 실제 답만 담고 미연결임을 밝힌다", () => {
    const l = fallbackLetter(history);
    expect(l.letter).toContain("소심했어");
    expect(l.letter).toContain("AI가 연결되어 있지 않아서");
    expect(l.discoveries).toEqual([]);
  });

  it("빈 기록은 400", async () => {
    expect((await letter(post({ history: [] }))).status).toBe(400);
  });
});

describe("AI 연결 시", () => {
  beforeEach(() => {
    vi.stubEnv("TILON_API_BASE_URL", "");
    vi.stubEnv("LLM_API_BASE_URL", "https://llm.example/v1");
    vi.stubEnv("LLM_MODEL", "m");
  });

  it("이전 대화를 프롬프트에 담아 보내고, 결과를 llm 출처로 돌려준다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '{"reply":"많이 달라졌네!","followUp":"언제부터 달라졌어?"}' } }] }))
    );
    vi.stubGlobal("fetch", fetchMock);
    const d = await (await reply(post({ topic: "지금의 나", question: "q", answer: "지금은 활발해", history }))).json();
    expect(d).toMatchObject({ source: "llm", reply: "많이 달라졌네!", followUp: "언제부터 달라졌어?" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages[1].content).toContain("소심했어");
  });

  it("편지: 사실과 발견을 나눠 받는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: '{"facts":["어릴 때 소심했다"],"discoveries":["용기를 내 온 것처럼 보였어"],"letter":"안녕, 나는 별의 아이야."}' } }] }))
      )
    );
    const d = await (await letter(post({ history }))).json();
    expect(d.facts).toEqual(["어릴 때 소심했다"]);
    expect(d.discoveries).toHaveLength(1);
    expect(d.source).toBe("llm");
  });
});
