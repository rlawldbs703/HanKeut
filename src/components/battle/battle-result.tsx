"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { COMPETENCY_LABELS, type Competency } from "@/lib/growth";
import { saveRecord } from "@/lib/storage";
import type { AiSource, BattleState, Evaluation, Scenario } from "@/types";

type EvalResponse = Evaluation & { source: AiSource };

export function BattleResult({
  scenario,
  state,
  onRetry,
}: {
  scenario: Scenario;
  state: BattleState;
  onRetry: () => void;
}) {
  const [evaluation, setEvaluation] = useState<EvalResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const requested = useRef(false); // 개발 모드에서 평가가 두 번 요청되는 것을 막아요
  const won = state.status === "won";

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    const result = won ? "won" : "lost";
    fetch("/api/battle/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, history: state.history, result }),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<EvalResponse>;
      })
      .then((data) => {
        setEvaluation(data);
        saveRecord({
          id: crypto.randomUUID(),
          scenarioId: scenario.id,
          scenarioTitle: scenario.title,
          category: scenario.category,
          result,
          finalGauge: state.gauge,
          turnsUsed: state.turn,
          scores: data.scores,
          total: data.total,
          createdAt: new Date().toISOString(),
          aiSource: data.source,
        });
      })
      .catch(() => setFailed(true));
  }, [scenario, state, won]);

  return (
    <div className="space-y-4">
      <Card className={won ? "bg-emerald-50 ring-emerald-300" : "bg-rose-50 ring-rose-200"}>
        <CardContent className="text-center">
          <p className="text-4xl">{won ? "🏆" : "💭"}</p>
          <p className="text-xl font-black">{won ? "미션 성공!" : "아쉽게 미션 실패"}</p>
          <p className="text-sm text-muted-foreground">
            최종 게이지 {state.gauge} / 목표 {scenario.goalGauge} · {state.turn}턴 사용
          </p>
        </CardContent>
      </Card>

      {!evaluation && !failed && (
        <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> 대화를 분석하고 있어요…
        </p>
      )}
      {failed && <p className="py-4 text-center text-sm text-destructive">평가를 불러오지 못했어요.</p>}

      {evaluation && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>3대 역량 평가</span>
                <span className="text-2xl font-black text-primary">{evaluation.total}점</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.keys(COMPETENCY_LABELS) as Competency[]).map((k) => (
                <div key={k} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{COMPETENCY_LABELS[k]}</span>
                    <b className="tabular-nums">{evaluation.scores[k]}</b>
                  </div>
                  <Progress value={evaluation.scores[k]} aria-label={COMPETENCY_LABELS[k]} />
                </div>
              ))}
              <div className="grid gap-2 pt-2 text-sm sm:grid-cols-2">
                <p className="rounded-lg bg-emerald-50 p-3">👍 {evaluation.feedback.strengths}</p>
                <p className="rounded-lg bg-amber-50 p-3">🔧 {evaluation.feedback.improvements}</p>
              </div>
              <p className="text-right text-xs text-muted-foreground">
                평가: {evaluation.source === "tilon" ? "🟢 틸론 GPU 모델" : "🧪 체험 모드(임시 평가 로직)"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>✂️ 한끗 차이 비교</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="rounded-lg border p-3">
                <Badge variant="outline" className="mb-1">
                  내 답변
                </Badge>
                <p>{evaluation.betterAnswer.original}</p>
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <Badge className="mb-1">한끗 더 나은 답변</Badge>
                <p>{evaluation.betterAnswer.improved}</p>
              </div>
              <p className="text-muted-foreground">💡 {evaluation.betterAnswer.why}</p>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onRetry}>다시 도전</Button>
        <Link href="/battle" className={buttonVariants({ variant: "outline" })}>
          다른 상황
        </Link>
        <Link href="/growth" className={buttonVariants({ variant: "outline" })}>
          성장 기록 보기
        </Link>
      </div>
    </div>
  );
}
