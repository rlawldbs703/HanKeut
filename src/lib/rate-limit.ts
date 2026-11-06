// 공개 배포 시 AI 무료 한도를 보호하는 간단한 요청 제한 (IP별, 서버 인스턴스 메모리 기준)
const hits = new Map<string, number[]>();

export function rateLimit(request: Request, key: string, limit: number, windowMs = 60_000): Response | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    return Response.json({ error: "요청이 너무 많아요. 1분 뒤에 다시 시도해 주세요." }, { status: 429 });
  }
  recent.push(now);
  hits.set(id, recent);
  if (hits.size > 5000) hits.clear(); // 메모리 보호
  return null;
}
