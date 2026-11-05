import { connection } from "next/server";
import { getAiStatus } from "@/lib/ai/service";

// AI 연결 상태 확인용 (API 키는 절대 돌려주지 않아요)
export async function GET() {
  await connection(); // 빌드 때 고정하지 않고, 요청할 때마다 환경변수를 확인해요.
  return Response.json(getAiStatus());
}
