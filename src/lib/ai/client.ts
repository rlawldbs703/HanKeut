// 교내 GPU(틸론) 모델을 호출하는 코드예요. 서버에서만 실행돼요.
// 틸론 API는 OpenAI 호환(/chat/completions) 형식이라고 가정해요. 형식이 다르면 이 파일만 고치면 돼요.
import "server-only";

export interface AiConfig {
  provider: "tilon" | "llm";
  baseUrl: string;
  apiKey?: string;
  model: string;
  fallbackModels?: string[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class AiError extends Error {}

/** 환경변수에서 LLM 설정을 읽어요. 주소나 모델이 없으면 null(=AI 미연결)이에요. */
export function getAiConfig(): AiConfig | null {
  const env = (k: string) => process.env[k]?.trim() || undefined;
  const clean = (u: string) => u.replace(/\/+$/, "");
  // 1순위: 교내 GPU(틸론)
  const tBase = env("TILON_API_BASE_URL"), tModel = env("TILON_MODEL");
  if (tBase && tModel) return { provider: "tilon", baseUrl: clean(tBase), apiKey: env("TILON_API_KEY"), model: tModel };
  // 2순위: 그 밖의 OpenAI 호환 LLM API (예: Vercel AI Gateway, OpenAI)
  const lBase = env("LLM_API_BASE_URL"), lModel = env("LLM_MODEL");
  if (lBase && lModel)
    return {
      provider: "llm",
      baseUrl: clean(lBase),
      apiKey: env("LLM_API_KEY"),
      model: lModel,
      fallbackModels: env("LLM_FALLBACK_MODELS")?.split(",").map((m) => m.trim()).filter(Boolean),
    };
  return null;
}

export async function chatCompletion(
  config: AiConfig,
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number; json?: boolean } = {}
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  // 기본 모델 → 예비 모델 순서로 시도 (예: 무료 등급 하루 한도 429면 다음 모델)
  const models = [config.model, ...(config.fallbackModels ?? [])];
  let res: Response | undefined;
  outer: for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        res = await fetch(`${config.baseUrl}/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 600,
            // JSON 응답 모드 (OpenAI·Gemini·vLLM 공통 지원)
            ...(options.json && { response_format: { type: "json_object" } }),
            // 생각(추론) 토큰이 많은 모델은 답이 잘리지 않도록 낮춤 (예: LLM_REASONING_EFFORT=low)
            ...(process.env.LLM_REASONING_EFFORT && config.provider === "llm" && { reasoning_effort: process.env.LLM_REASONING_EFFORT }),
          }),
          signal: AbortSignal.timeout(options.timeoutMs ?? 45_000),
        });
      } catch (e) {
        throw new AiError(`AI 서버에 연결하지 못했어요: ${(e as Error).message}`);
      }
      if (res.ok) break outer;
      if (res.status === 429) continue outer; // 한도 초과 → 바로 다음 모델
      if (res.status !== 503 || attempt === 1) break outer; // 503(일시 과부하)만 한 번 더
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if (!res) throw new AiError("AI 서버 응답이 없어요.");
  if (!res.ok) throw new AiError(`AI 서버 응답 오류 (HTTP ${res.status})`);

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new AiError("AI 응답이 비어 있어요.");
  return content;
}
