// 교내 GPU(틸론) 모델을 호출하는 코드예요. 서버에서만 실행돼요.
// 틸론 API는 OpenAI 호환(/chat/completions) 형식이라고 가정해요. 형식이 다르면 이 파일만 고치면 돼요.
import "server-only";

export interface AiConfig {
  provider: "tilon" | "llm";
  baseUrl: string;
  apiKey?: string;
  model: string;
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
  if (lBase && lModel) return { provider: "llm", baseUrl: clean(lBase), apiKey: env("LLM_API_KEY"), model: lModel };
  return null;
}

export async function chatCompletion(
  config: AiConfig,
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number; frequencyPenalty?: number } = {}
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 600,
        ...(options.frequencyPenalty !== undefined && { frequency_penalty: options.frequencyPenalty }),
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
    });
  } catch (e) {
    throw new AiError(`AI 서버에 연결하지 못했어요: ${(e as Error).message}`);
  }

  if (!res.ok) throw new AiError(`AI 서버 응답 오류 (HTTP ${res.status})`);

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new AiError("AI 응답이 비어 있어요.");
  return content;
}
