"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { AiSource } from "@/types";

/** 지금 AI가 틸론 GPU로 연결됐는지, 데모 모드인지 보여 줘요. */
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
    <Badge variant="secondary" title="틸론 API가 설정되지 않아 규칙 기반 데모로 동작해요">
      🟡 데모 모드
    </Badge>
  );
}
