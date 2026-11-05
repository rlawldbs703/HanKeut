"use client";

import { Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, getScenarioById } from "@/data/scenarios";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  MESSAGE_MAX_LENGTH,
  applyTurn,
  createBattle,
  turnsLeft,
  validateUserMessage,
} from "@/lib/game/engine";
import { loadAiScenario } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { AiSource, BattleState, Scenario, TurnResult } from "@/types";
import { BattleResult } from "./battle-result";
import { GaugeBar } from "./gauge-bar";

export function BattleRoom({ scenarioId }: { scenarioId: string }) {
  const hydrated = useHydrated();
  // 기본 시나리오에서 먼저 찾고, 없으면 브라우저에 저장된 AI 생성 시나리오에서 찾아요.
  const scenario = getScenarioById(scenarioId) ?? (hydrated ? loadAiScenario(scenarioId) : undefined);

  if (!scenario) {
    if (!hydrated) return <Loader2 className="mx-auto mt-10 animate-spin" />;
    return (
      <div className="space-y-3 py-10 text-center">
        <p>상황을 찾을 수 없어요.</p>
        <Link href="/battle" className={buttonVariants()}>
          상황 고르러 가기
        </Link>
      </div>
    );
  }
  return <BattleGame key={scenario.id} scenario={scenario} />;
}

function BattleGame({ scenario }: { scenario: Scenario }) {
  const [state, setState] = useState<BattleState>(() => createBattle(scenario));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<AiSource | null>(null);
  const [round, setRound] = useState(0); // 다시 도전할 때 결과 화면을 새로 만들기 위한 번호
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state.history.length, loading]);

  async function send() {
    const error = validateUserMessage(input);
    if (error) {
      toast.warning(error);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/battle/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          gauge: state.gauge,
          history: state.history,
          userMessage: input,
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as TurnResult & { source: AiSource; fallbackReason?: string };
      if (source === "tilon" && data.source === "demo" && data.fallbackReason) toast.info(data.fallbackReason);
      setSource(data.source);
      setState((prev) => applyTurn(prev, scenario, input, data));
      setInput("");
    } catch {
      toast.error("AI 응답을 받지 못했어요. 다시 보내 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setState(createBattle(scenario));
    setInput("");
    setRound((r) => r + 1);
  }

  const ended = state.status !== "playing";
  const { character } = scenario;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="text-4xl">{character.emoji}</div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-bold">{scenario.title}</h1>
                <Badge variant="outline">{CATEGORY_LABELS[scenario.category]}</Badge>
                {scenario.isAiGenerated && <Badge>✨ AI 생성</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{scenario.situation}</p>
              <p className="text-sm">
                🎯 <b>미션</b> {scenario.mission}
              </p>
            </div>
          </div>
          <GaugeBar value={state.gauge} goal={scenario.goalGauge} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              상대: {character.name} ({character.role})
            </span>
            <span>
              남은 턴 <b className="text-foreground">{turnsLeft(state, scenario)}</b> / {scenario.maxTurns}
              {source && (source === "tilon" ? " · 🟢 틸론 GPU" : " · 🟡 데모")}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3" aria-live="polite">
        {state.history.map((t, i) =>
          t.role === "opponent" ? (
            <div key={i} className="flex items-end gap-2">
              <span className="text-2xl">{character.emoji}</span>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-background px-4 py-2 shadow-sm ring-1 ring-border">
                <p className="text-xs font-semibold text-muted-foreground">{character.name}</p>
                <p>{t.content}</p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex flex-col items-end gap-1">
              <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground">
                {t.content}
              </div>
              {t.delta !== undefined && (
                <div className="flex max-w-[85%] items-start gap-2 text-xs">
                  <Badge
                    className={cn(
                      "shrink-0",
                      t.delta > 0 && "bg-emerald-600 text-white",
                      t.delta < 0 && "bg-rose-600 text-white",
                      t.delta === 0 && "bg-muted text-foreground"
                    )}
                  >
                    {t.delta > 0 ? `+${t.delta}` : t.delta}
                  </Badge>
                  <span className="text-muted-foreground">{t.reason}</span>
                </div>
              )}
            </div>
          )
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-2xl">{character.emoji}</span>
            <Loader2 className="size-4 animate-spin" /> {character.name}이(가) 생각하는 중…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {ended ? (
        <BattleResult key={round} scenario={scenario} state={state} onRetry={retry} />
      ) : (
        <Card className="sticky bottom-3">
          <CardContent className="space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // 한글 입력 중(조합 중)에는 Enter로 보내지 않아요.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (!loading) send();
                }
              }}
              placeholder="직접 생각해서 답해 보세요. (Enter 전송, Shift+Enter 줄바꿈)"
              maxLength={MESSAGE_MAX_LENGTH}
              disabled={loading}
              rows={2}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs tabular-nums text-muted-foreground">
                {input.length}/{MESSAGE_MAX_LENGTH}
              </span>
              <Button onClick={send} disabled={loading || input.trim().length === 0}>
                {loading ? <Loader2 className="animate-spin" /> : <Send />} 보내기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
