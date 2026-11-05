"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { AiSource } from "@/types";

/** 틸론 GPU 연결 상태 또는 체험 모드(임시 응답)를 보여 줘요. */
export function AiStatusBadge() {
  const [status, setStatus] = useState<{ source: AiSource; model?: string } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ source: "demo" }));
  }, []);

  if (!status) return <Badge variant="outline">AI 확인 중…</Badge>;
  return status.source === "tilon" ? (
    <Badge title={status.model}>🟢 틸론 GPU 연결</Badge>
  ) : (
    <Badge variant="secondary" title="실제 AI가 아닌 임시 응답 로직으로 동작해요">
      🧪 체험 모드
    </Badge>
  );
}
