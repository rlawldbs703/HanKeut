// 교내 GPU(틸론) 모델을 호출하는 코드예요. 서버에서만 실행돼요.
// 틸론 API는 OpenAI 호환(/chat/completions) 형식이라고 가정해요. 형식이 다르면 이 파일만 고치면 돼요.
import "server-only";

export interface AiConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class AiError extends Error {}

/** 환경변수에서 틸론 설정을 읽어요. 주소나 모델이 없으면 null(=데모 모드)이에요. */
export function getAiConfig(): AiConfig | null {
  const baseUrl = process.env.TILON_API_BASE_URL?.trim();
  const model = process.env.TILON_MODEL?.trim();
  if (!baseUrl || !model) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey: process.env.TILON_API_KEY?.trim(), model };
}

export async function chatCompletion(
  config: AiConfig,
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {}
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
