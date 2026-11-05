"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { AiSource } from "@/types";

/** AI 연결 상태: 틸론 GPU / 다른 LLM / 미연결 */
export function AiStatusBadge() {
  const [status, setStatus] = useState<{ source: AiSource; model?: string } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ source: "demo" }));
  }, []);

  if (!status) return <Badge variant="outline">AI 확인 중…</Badge>;
  if (status.source === "tilon") return <Badge title={status.model}>🟢 틸론 GPU</Badge>;
  if (status.source === "llm") return <Badge title={status.model}>🟢 AI 연결됨</Badge>;
  return (
    <Badge variant="secondary" title="LLM이 연결되지 않았어요. 실제 AI 응답이 아니에요.">
      ⚪ AI 미연결
    </Badge>
  );
}
