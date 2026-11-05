// API 라우트 공통 처리: 요청 검사 → 기능 실행 → JSON 응답
import "server-only";
import type { z } from "zod";

export function createHandler<S extends z.ZodTypeAny, R>(schema: S, run: (input: z.output<S>) => Promise<R>) {
  return async function POST(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "요청 내용이 올바르지 않아요." }, { status: 400 });
    }
    try {
      return Response.json(await run(parsed.data));
    } catch (e) {
      console.error("[API] 처리 실패:", e);
      return Response.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
  };
}
