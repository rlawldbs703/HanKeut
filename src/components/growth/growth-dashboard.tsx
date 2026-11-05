"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_LABELS } from "@/data/scenarios";
import { useHydrated } from "@/hooks/use-hydrated";
import { COMPETENCY_LABELS, type Competency, summarizeGrowth } from "@/lib/growth";
import { clearRecords, loadRecords } from "@/lib/storage";

export function GrowthDashboard() {
  const hydrated = useHydrated();
  if (!hydrated) return <Loader2 className="mx-auto mt-10 animate-spin" />;
  return <Dashboard />;
}

function Dashboard() {
  const [records, setRecords] = useState(() => loadRecords());
  const summary = summarizeGrowth(records);

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 py-10 text-center">
          <p className="text-4xl">🌱</p>
          <p>아직 대결 기록이 없어요. 첫 대결을 시작해 볼까요?</p>
          <Link href="/battle" className={buttonVariants()}>
            대결 시작하기
          </Link>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { label: "총 대결", value: `${summary.totalBattles}회` },
    { label: "승률", value: `${summary.winRate}%` },
    { label: "평균 점수", value: `${summary.averageTotal}점` },
    {
      label: "최근 5판 변화",
      value:
        summary.recentChange === null
          ? "6판부터"
          : `${summary.recentChange >= 0 ? "+" : ""}${summary.recentChange}점`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-black tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>역량별 평균</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(COMPETENCY_LABELS) as Competency[]).map((k) => (
            <div key={k} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>
                  {COMPETENCY_LABELS[k]} {summary.weakest === k && <Badge variant="destructive">보완 필요</Badge>}
                </span>
                <b className="tabular-nums">{summary.averageScores[k]}</b>
              </div>
              <Progress value={summary.averageScores[k]} aria-label={COMPETENCY_LABELS[k]} />
            </div>
          ))}
          {summary.weakest && (
            <p className="rounded-lg bg-primary/5 p-3 text-sm">
              💡 <b>{COMPETENCY_LABELS[summary.weakest]}</b>이(가) 가장 약해요. 한끗차이에서 <b>✨ AI 맞춤 상황 생성</b>을
              누르면 이 역량을 연습할 상황을 만들어 줘요.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>대결 기록</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {[...records].reverse().map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="text-lg">{r.result === "won" ? "🏆" : "💭"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.scenarioTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[r.category]} · {new Date(r.createdAt).toLocaleString("ko-KR")} ·{" "}
                  {r.aiSource === "tilon" ? "틸론 GPU" : "데모"}
                </p>
              </div>
              <b className="tabular-nums">{r.total}점</b>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("모든 대결 기록을 지울까요?")) {
              clearRecords();
              setRecords([]);
            }
          }}
        >
          기록 초기화
        </Button>
      </div>
    </div>
  );
}
