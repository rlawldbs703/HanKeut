"use client";

import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES, CATEGORY_LABELS, getScenariosByCategory } from "@/data/scenarios";
import { summarizeGrowth } from "@/lib/growth";
import { loadRecords, saveAiScenario } from "@/lib/storage";
import type { Category, Scenario } from "@/types";

export function ScenarioPicker() {
  const router = useRouter();
  const [generating, setGenerating] = useState<Category | null>(null);

  async function generate(category: Category) {
    setGenerating(category);
    try {
      // 지금까지 기록에서 가장 약한 역량을 골라 맞춤 상황을 요청해요.
      const focus = summarizeGrowth(loadRecords()).weakest ?? undefined;
      const res = await fetch("/api/scenario/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, focus }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { scenario: Scenario; fallbackReason?: string };
      if (data.fallbackReason) toast.info(data.fallbackReason);
      saveAiScenario(data.scenario);
      router.push(`/battle/${data.scenario.id}`);
    } catch {
      toast.error("상황을 만들지 못했어요. 다시 시도해 주세요.");
      setGenerating(null);
    }
  }

  return (
    <Tabs defaultValue="school">
      <TabsList className="w-full">
        {CATEGORIES.map((c) => (
          <TabsTrigger key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </TabsTrigger>
        ))}
      </TabsList>

      {CATEGORIES.map((c) => (
        <TabsContent key={c} value={c} className="mt-4 space-y-3">
          {getScenariosByCategory(c).map((s) => (
            <Link key={s.id} href={`/battle/${s.id}`} className="block">
              <Card className="transition hover:ring-2 hover:ring-primary/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{s.character.emoji}</span> {s.title}
                  </CardTitle>
                  <CardDescription>{s.situation}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="h-auto whitespace-normal">
                    🎯 {s.mission}
                  </Badge>
                  <Badge variant="secondary">
                    게이지 {s.startGauge} → {s.goalGauge} · {s.maxTurns}턴
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}

          <Card className="border-dashed bg-primary/5">
            <CardContent className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">✨ AI 맞춤 상황 생성</p>
                <p className="text-sm text-muted-foreground">
                  내 기록에서 약한 역량을 반영해 새로운 {CATEGORY_LABELS[c]} 상황을 만들어요.
                </p>
              </div>
              <Button onClick={() => generate(c)} disabled={generating !== null}>
                {generating === c ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {generating === c ? "만드는 중…" : "만들기"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
