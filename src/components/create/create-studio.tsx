"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractElements } from "@/lib/create/mock";
import type { CreationStep, Idea, Twist } from "@/lib/create/types";
import { saveCreation } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { AiSource } from "@/types";

const EMPTY: Idea = { title: "", genre: "", world: "", character: "", story: "" };
// 대표 콘텐츠 《별의 끝에서》 원작 설정으로 바로 시작
const STARS_PRESET: Idea = {
  title: "별의 끝에서",
  genre: "감성 스토리 퍼즐 어드벤처 (2.5D 탐험)",
  world: "현실과 꿈의 경계에 있는 별빛 세계. 사람들의 기억이 빛으로 남는다.",
  character: "기억을 잃은 별빛 아이, 과거의 목소리를 들려주는 라디오, 망각과 후회를 상징하는 그림자",
  story: "소중한 누군가에게 별을 전하기 위해 별 조각을 모으며 기억을 되찾는다.",
};
const FIELDS: { key: keyof Idea; label: string; placeholder: string; long?: boolean }[] = [
  { key: "title", label: "제목", placeholder: "예: 별빛 탐험" },
  { key: "genre", label: "장르", placeholder: "예: 2.5D 탐험 퍼즐" },
  { key: "world", label: "세계관", placeholder: "어떤 세계인가요?", long: true },
  { key: "character", label: "캐릭터", placeholder: "누가 등장하나요?", long: true },
  { key: "story", label: "스토리", placeholder: "무슨 일이 일어나나요?", long: true },
];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error();
  return res.json();
}

const SourceBadge = ({ source }: { source: AiSource | null }) =>
  source === "tilon" ? <Badge>🟢 틸론 GPU</Badge> : source === "demo" ? <Badge variant="secondary">🧪 체험 모드(임시 로직)</Badge> : null;

export function CreateStudio() {
  const [idea, setIdea] = useState<Idea>(EMPTY);
  const [started, setStarted] = useState(false);
  const [twists, setTwists] = useState<Twist[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [edit, setEdit] = useState("");
  const [steps, setSteps] = useState<CreationStep[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState<"twist" | "develop" | null>(null);
  const [source, setSource] = useState<AiSource | null>(null);

  async function loadTwists(currentSteps = steps) {
    setLoading("twist");
    setChosen(null);
    setEdit("");
    try {
      const d = await post<{ twists: Twist[]; source: AiSource }>("/api/create/twist", { idea, steps: currentSteps });
      setTwists(d.twists);
      setSource(d.source);
    } catch {
      toast.error("제안을 받지 못했어요.");
    } finally {
      setLoading(null);
    }
  }

  async function develop() {
    if (chosen === null) return;
    setLoading("develop");
    try {
      const pick = twists[chosen];
      const d = await post<{ result: string; nextQuestion: string; source: AiSource }>("/api/create/develop", {
        idea,
        steps,
        chosen: pick,
        userEdit: edit,
      });
      const next = [...steps, { chosen: pick, userEdit: edit.trim(), result: d.result }];
      setSteps(next);
      saveCreation(edit.trim() || pick.title); // PLAY 정원에 함께 만든 기억으로 나타나요
      setQuestion(d.nextQuestion);
      setSource(d.source);
      setTwists([]);
      setChosen(null);
      setEdit("");
    } catch {
      toast.error("발전시키지 못했어요.");
    } finally {
      setLoading(null);
    }
  }

  // ① IDEA
  if (!started) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>① IDEA · 내 게임 아이디어</CardTitle>
          <CardDescription>창작의 방향은 내가 정해요. 떠오르는 만큼만 적어도 괜찮아요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={() => setIdea(STARS_PRESET)}>
            ✦ 《별의 끝에서》 설정으로 채우기
          </Button>
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label htmlFor={f.key}>{f.label}</Label>
              {f.long ? (
                <Textarea id={f.key} rows={2} placeholder={f.placeholder} value={idea[f.key]} onChange={(e) => setIdea({ ...idea, [f.key]: e.target.value })} />
              ) : (
                <Input id={f.key} placeholder={f.placeholder} value={idea[f.key]} onChange={(e) => setIdea({ ...idea, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
          <Button
            className="w-full"
            size="lg"
            disabled={!idea.title.trim()}
            onClick={() => {
              setStarted(true);
              loadTwists([]);
            }}
          >
            <Sparkles /> TWIST 받기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold">{idea.title}</p>
            <SourceBadge source={source} />
          </div>
          <div className="flex flex-wrap gap-1">
            {extractElements(idea).map((e) => (
              <Badge key={e} variant="outline">
                {e}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CREATE 기록 */}
      {steps.map((s, i) => (
        <Card key={i} size="sm">
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">{i + 1}차 공동 창작</p>
            <p>
              <Badge variant="secondary">🤖 제안</Badge> [{s.chosen.axis}] {s.chosen.title}
            </p>
            <p>
              <Badge>👤 창작자</Badge> {s.userEdit || "제안을 그대로 채택"}
            </p>
            <p className="whitespace-pre-wrap rounded-lg bg-secondary/60 p-3">{s.result}</p>
          </CardContent>
        </Card>
      ))}
      {question && <p className="rounded-lg bg-accent/60 p-3 text-sm">💭 다음 고민: {question}</p>}

      {/* ② TWIST */}
      {loading === "twist" && (
        <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> 제안을 만드는 중…
        </p>
      )}
      {twists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>② TWIST · 한끗 다른 제안</CardTitle>
            <CardDescription>마음에 드는 방향 하나를 고르세요.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {twists.map((t, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={chosen === i}
                onClick={() => setChosen(i)}
                className={cn("space-y-2 rounded-xl border p-3 text-left text-sm transition hover:bg-secondary", chosen === i && "border-primary bg-secondary ring-2 ring-primary/40")}
              >
                <Badge variant="outline">{t.axis}</Badge>
                <p className="font-bold">{t.title}</p>
                <p>{t.pitch}</p>
                <p className="text-xs text-muted-foreground">✂️ {t.whyDifferent}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ③ CREATE */}
      {chosen !== null && (
        <Card>
          <CardHeader>
            <CardTitle>③ CREATE · 내 생각으로 고치기</CardTitle>
            <CardDescription>제안을 그대로 쓰지 말고, 바꾸고 싶은 부분을 직접 적어 보세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea rows={3} placeholder="예: 시점 전환은 좋은데, 소녀가 아니라 별이 화자였으면 좋겠어" value={edit} onChange={(e) => setEdit(e.target.value)} />
            <Button className="w-full" onClick={develop} disabled={loading !== null}>
              {loading === "develop" ? <Loader2 className="animate-spin" /> : <Sparkles />} 함께 발전시키기
            </Button>
          </CardContent>
        </Card>
      )}

      {twists.length === 0 && loading === null && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => loadTwists()}>
            <RefreshCw /> 다음 TWIST 받기
          </Button>
          <Link href="/play" className={buttonVariants({ variant: "outline" })}>
            ④ PLAY · 별의 끝에서
          </Link>
        </div>
      )}
    </div>
  );
}
