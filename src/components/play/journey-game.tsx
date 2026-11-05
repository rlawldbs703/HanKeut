"use client";

// 《별의 끝에서》 — 별의 아이와 함께 여행하며 나의 이야기를 들려주는 2.5D 탐험
import { Loader2, Maximize, Send, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FIRST_QUESTION, REGIONS, type Spot, type Theme } from "@/lib/journey/regions";
import type { Exchange, LetterResult } from "@/lib/journey/types";
import { cn } from "@/lib/utils";
import type { AiSource } from "@/types";
import { playChime, playResolve, setMuted, startAmbient, stopAmbient } from "./audio";
import { Floor, Foreground, Lanterns, MidLayer, Motes, Sky, StarChild, StarField } from "./scene-art";
import { TimeCapsule } from "./time-capsule";

type Phase = "title" | "guide" | "explore" | "farewell" | "letterDrop" | "letter" | "capsule";
interface Ask {
  question: string;
  spotId: string | null; // null = 첫 질문
  qIndex: number;
  isFollowUp: boolean;
}
interface Talk {
  queue: string[];
  ask?: Ask;
  onDone?: () => void;
}

const SPEED = 280;
const THEME_STAGE: Record<Theme, "house" | "garden"> = { house: "house", garden: "garden", lake: "garden", hill: "garden", gate: "garden" };
const THEME_FILTER: Record<Theme, string> = {
  house: "none",
  garden: "none",
  lake: "hue-rotate(-55deg) saturate(1.1)",
  hill: "hue-rotate(25deg) saturate(1.2) brightness(1.05)",
  gate: "brightness(0.85) saturate(0.9)",
};

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error();
  return r.json();
}

export function JourneyGame() {
  const [phase, setPhase] = useState<Phase>("title");
  const [regionIdx, setRegionIdx] = useState(0);
  const [pos, setPos] = useState({ x: 140, lane: 0.5, facing: 1 as 1 | -1, moving: false });
  const [talk, setTalk] = useState<Talk | null>(null);
  const [typed, setTyped] = useState(0);
  const [answer, setAnswer] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [history, setHistory] = useState<Exchange[]>([]);
  const [doneSpots, setDoneSpots] = useState<string[]>([]);
  const [source, setSource] = useState<AiSource | null>(null);
  const [letter, setLetter] = useState<(LetterResult & { source: AiSource }) | null>(null);
  const [farewellStep, setFarewellStep] = useState(0);
  const [muted, setMute] = useState(false);
  const [viewW, setViewW] = useState(900);

  const keys = useRef(new Set<string>());
  const posRef = useRef(pos);
  const viewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const letterReq = useRef(false);

  const region = REGIONS[regionIdx];
  const stage = THEME_STAGE[region.theme];
  const progress = (regionIdx + doneSpots.filter((id) => region.spots.some((s) => s.id === id)).length / Math.max(1, region.spots.length)) / 4;
  const hope = Math.min(1, progress);
  const regionDone = region.spots.every((s) => doneSpots.includes(s.id));
  const line = talk?.queue[0];
  const fullyTyped = line ? typed >= line.length : true;
  const asking = talk && talk.queue.length === 0 && talk.ask;

  // 화면 폭
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setViewW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 글자가 한 자씩 나타나는 효과 (Space로 건너뛰기)
  useEffect(() => {
    if (!line) return;
    const id = setInterval(() => setTyped((n) => (n >= line.length ? n : n + 1)), 28);
    return () => clearInterval(id);
  }, [line]);

  // 질문이 나오면 입력창에 포커스
  useEffect(() => {
    if (asking) inputRef.current?.focus();
  }, [asking]);

  // 이동 루프 (대화 중에는 멈춤)
  const paused = phase !== "explore" || talk !== null;
  useEffect(() => {
    if (paused) {
      keys.current.clear();
      return;
    }
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = keys.current;
      const dx = (k.has("right") ? 1 : 0) - (k.has("left") ? 1 : 0);
      const dl = (k.has("up") ? 1 : 0) - (k.has("down") ? 1 : 0);
      const p = posRef.current;
      const next = {
        x: Math.max(60, Math.min(region.width - 60, p.x + dx * SPEED * dt)),
        lane: Math.max(0, Math.min(1, p.lane + dl * 0.9 * dt)),
        facing: (dx ? (dx > 0 ? 1 : -1) : p.facing) as 1 | -1,
        moving: dx !== 0 || dl !== 0,
      };
      posRef.current = next;
      setPos(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, region.width]);

  function say(queue: string[], opts: Omit<Talk, "queue"> = {}) {
    setTyped(0);
    setTalk({ queue, ...opts });
  }

  /** Space / 클릭: 글자 건너뛰기 → 다음 대사 */
  function advance() {
    if (!talk || !line) return;
    if (!fullyTyped) {
      setTyped(line.length);
      return;
    }
    const rest = talk.queue.slice(1);
    setTyped(0);
    if (rest.length > 0 || talk.ask) setTalk({ ...talk, queue: rest });
    else {
      setTalk(null);
      talk.onDone?.();
    }
  }

  function questionFor(spot: Spot | null, qIndex: number): string | undefined {
    return spot ? spot.questions[qIndex] : qIndex === 0 ? FIRST_QUESTION : undefined;
  }

  function askNext(spot: Spot | null, qIndex: number, followUp?: string | null) {
    if (followUp) return say([], { ask: { question: followUp, spotId: spot?.id ?? null, qIndex, isFollowUp: true } });
    const q = questionFor(spot, qIndex);
    if (q) return say([], { ask: { question: q, spotId: spot?.id ?? null, qIndex, isFollowUp: false } });
    // 이 장소의 질문 끝
    if (!spot) return say([...REGIONS[0].intro]);
    const nowDone = [...doneSpots, spot.id];
    setDoneSpots(nowDone);
    playChime();
    const allDone = region.spots.every((s) => nowDone.includes(s.id));
    say([allDone ? "이곳의 이야기는 다 들은 것 같아. 저 끝의 빛을 따라 다음 장소로 가 보자." : "다른 빛도 너를 기다리는 것 같아."]);
  }

  async function submitAnswer() {
    if (!talk?.ask || waiting) return;
    const ask = talk.ask;
    const text = answer.trim();
    if (!text) {
      toast.info("짧게라도 괜찮아. 떠오르는 대로 적어 줘.");
      return;
    }
    setWaiting(true);
    try {
      const d = await post<{ reply: string; followUp: string | null; source: AiSource }>("/api/journey/reply", {
        topic: ask.spotId ? region.topic : "자기소개",
        question: ask.question,
        answer: text,
        isFollowUp: ask.isFollowUp,
        history,
      });
      setSource(d.source);
      setHistory((h) => [...h, { region: ask.spotId ? region.name : "첫 만남", question: ask.question, answer: text, reply: d.reply }]);
      setAnswer("");
      const spot = region.spots.find((s) => s.id === ask.spotId) ?? null;
      const nextIndex = ask.isFollowUp ? ask.qIndex + 1 : d.followUp ? ask.qIndex : ask.qIndex + 1;
      say([d.reply], { onDone: () => askNext(spot, nextIndex, ask.isFollowUp ? null : d.followUp) });
    } catch {
      toast.error("별빛이 잠시 흔들렸어. 다시 보내 줘.");
    } finally {
      setWaiting(false);
    }
  }

  const objects = [
    ...region.spots.map((s) => ({ id: s.id, kind: "spot" as const, x: s.x, lane: s.lane, label: s.label, spot: s })),
    region.theme === "gate"
      ? { id: "gate", kind: "gate" as const, x: region.width - 320, lane: 0.5, label: "마지막 관문", spot: undefined }
      : { id: "portal", kind: "portal" as const, x: region.width - 140, lane: 0.5, label: regionDone ? "다음 장소로" : "아직 닫힌 빛", spot: undefined },
  ];
  const near = objects.find((o) => Math.abs(o.x - pos.x) < 85 && Math.abs(o.lane - pos.lane) < 0.45 && !(o.kind === "spot" && doneSpots.includes(o.id)));

  function interact() {
    if (!near) return;
    if (near.kind === "spot" && near.spot) {
      askNext(near.spot, 0);
    } else if (near.kind === "portal") {
      if (!regionDone) return say(["빛을 아직 다 모으지 못했어. 반짝이는 곳에 먼저 가 보자."]);
      playResolve();
      const next = regionIdx + 1;
      setRegionIdx(next);
      posRef.current = { ...posRef.current, x: 140, lane: 0.5 };
      setPos(posRef.current);
      say([`— ${REGIONS[next].name} —`, ...REGIONS[next].intro]);
    } else if (near.kind === "gate") {
      startFarewell();
    }
  }

  // 마지막 관문: 편지를 미리 요청해 두고 작별 연출
  function startFarewell() {
    if (!letterReq.current) {
      letterReq.current = true;
      post<LetterResult & { source: AiSource }>("/api/journey/letter", { history: history.length ? history : [{ region: "-", question: FIRST_QUESTION, answer: "", reply: "" }] })
        .then(setLetter)
        .catch(() => toast.error("편지를 쓰지 못했어. 다시 시도해 줘."));
    }
    const quotes = history.filter((h) => h.answer.length > 1).slice(0, 4).map((h) => `"${h.answer.length > 40 ? h.answer.slice(0, 40) + "…" : h.answer}"`);
    say(
      [
        "여기가 마지막 관문이야. 함께 걸어 줘서 정말 고마웠어.",
        "사실… 나는 멀티버스의 다른 별에서 왔어. 너의 이야기를 듣고 싶어서 여기까지 함께 여행했어.",
        ...(quotes.length ? ["네가 들려준 말들이 아직 반짝이고 있어.", ...quotes] : ["조용히 함께 걸은 시간도 나한테는 소중했어."]),
        "이제 나는 다른 별로 떠나야 해. 내 마음은… 여기에 남겨 둘게.",
      ],
      {
        onDone: () => {
          setPhase("farewell");
          setFarewellStep(1);
          playResolve();
          setTimeout(() => setPhase("letterDrop"), 3200);
        },
      }
    );
  }

  function beginJourney() {
    startAmbient();
    setPhase("explore");
    say(["…아, 왔구나. 별빛이 너를 데려왔나 봐.", "나는 별의 아이야. 오늘은 너와 함께 걸어 보고 싶어."], { onDone: () => askNext(null, 0) });
  }
  // 키보드: WASD(방향키) 이동, SPACE 대화 넘기기
  useEffect(() => {
    const map: Record<string, string> = { a: "left", A: "left", ArrowLeft: "left", d: "right", D: "right", ArrowRight: "right", w: "up", W: "up", ArrowUp: "up", s: "down", S: "down", ArrowDown: "down" };
    const down = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT";
      if (typing || phase === "title" || phase === "letter" || phase === "capsule") return;
      if (map[e.key]) {
        e.preventDefault();
        keys.current.add(map[e.key]);
      } else if (e.key === " ") {
        e.preventDefault();
        if (e.repeat) return;
        if (phase === "guide") beginJourney();
        else if (talk && line) advance();
        else if (!talk) interact();
      }
    };
    const up = (e: KeyboardEvent) => map[e.key] && keys.current.delete(map[e.key]);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  useEffect(() => () => stopAmbient(), []);



  const cam = Math.max(0, Math.min(region.width - viewW, pos.x - viewW / 2));
  const laneBottom = (lane: number) => `${10 + lane * 24}%`;
  const laneScale = (lane: number) => 1 - lane * 0.35;
  const companionX = pos.x - pos.facing * 70;
  const hold = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      keys.current.add(k);
    },
    onPointerUp: () => keys.current.delete(k),
    onPointerLeave: () => keys.current.delete(k),
  });

  return (
    <div className="space-y-3">
      <div
        ref={viewRef}
        data-testid="game"
        data-phase={phase}
        data-region={region.id}
        data-x={Math.round(pos.x)}
        data-lane={pos.lane.toFixed(2)}
        className="relative aspect-[16/10] w-full touch-none select-none overflow-hidden rounded-2xl bg-indigo-950 shadow-2xl ring-1 ring-indigo-900/40 sm:aspect-video"
      >
        {phase !== "title" && <div key={region.id} className="animate-out fade-out fill-mode-forwards pointer-events-none absolute inset-0 z-[35] bg-black duration-1000" />}

        {/* 배경 (지역 테마별 색) */}
        <div className="absolute inset-0" style={{ filter: THEME_FILTER[region.theme] }}>
          <div className="absolute inset-0 transition-[filter] duration-1000" style={{ filter: `brightness(${0.72 + hope * 0.35})` }}>
            <Sky stage={stage} hope={hope} />
          </div>
          <StarField hope={hope} />
          <div className="absolute inset-0 will-change-transform" style={{ transform: `translateX(${-cam * 0.55}px)` }}>
            <MidLayer stage={stage} width={region.width * 0.55 + viewW} />
            {stage === "house" && <Lanterns width={region.width * 0.55 + viewW} />}
          </div>
          <Floor stage={stage} />
          <Motes stage={stage} hope={hope} />
        </div>

        {/* 월드 */}
        <div className="absolute inset-0" style={{ transform: `translateX(${-cam}px)` }}>
          {objects.map((o) => {
            const done = o.kind === "spot" && doneSpots.includes(o.id);
            return (
              <div key={o.id} data-object={o.id} className="absolute" style={{ left: o.x, bottom: laneBottom(o.lane), zIndex: Math.round((1 - o.lane) * 10), transform: `translateX(-50%) scale(${laneScale(o.lane)})`, transformOrigin: "bottom" }}>
                {o.kind === "spot" && <SpotArt done={done} />}
                {o.kind === "portal" && <PortalArt open={regionDone} />}
                {o.kind === "gate" && <GateArt />}
              </div>
            );
          })}
          {/* 별의 아이 (동행) */}
          {phase !== "letterDrop" && phase !== "letter" && phase !== "capsule" && (
            <div className="absolute transition-[left] duration-300" style={{ left: companionX, bottom: `calc(${laneBottom(pos.lane)} + 40px)`, zIndex: 12, transform: `translateX(-50%) scale(${laneScale(pos.lane) * 0.75})`, transformOrigin: "bottom" }}>
              <StarChild moving={false} dissolve={phase === "farewell"} />
            </div>
          )}
          {/* 남겨진 편지 */}
          {(phase === "letterDrop" || phase === "letter" || phase === "capsule") && (
            <button
              type="button"
              aria-label="별의 아이의 편지 열기"
              onClick={() => setPhase("letter")}
              className="absolute animate-[bounce_2s_infinite]"
              style={{ left: companionX, bottom: laneBottom(pos.lane), zIndex: 15, transform: "translateX(-50%)" }}
            >
              <EnvelopeArt />
            </button>
          )}
          {/* 플레이어 */}
          <div className="absolute" style={{ left: pos.x, bottom: laneBottom(pos.lane), zIndex: Math.round((1 - pos.lane) * 10) + 1, transform: `translateX(-50%) scale(${laneScale(pos.lane) * pos.facing}, ${laneScale(pos.lane)})`, transformOrigin: "bottom" }}>
            <Traveler moving={pos.moving} />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 will-change-transform" style={{ transform: `translateX(${-cam * 1.25}px)` }}>
          <Foreground stage={stage} width={region.width * 1.25 + viewW} />
        </div>
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(15,10,40,0.8)]" />

        {/* HUD */}
        {phase !== "title" && phase !== "guide" && (
          <div className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs text-amber-50">
            <span>{region.name}</span>
            <span>{"✦".repeat(regionIdx)}{"·".repeat(4 - Math.min(4, regionIdx))}</span>
            {source === "demo" && <span className="text-amber-200">⚪ AI 미연결</span>}
          </div>
        )}
        <div className="absolute right-3 top-3 z-30 flex gap-2">
          <button type="button" aria-label="전체화면" className="rounded-full bg-black/35 p-1.5 text-amber-50" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : viewRef.current?.requestFullscreen())}>
            <Maximize className="size-4" />
          </button>
          <button type="button" aria-label={muted ? "소리 켜기" : "소리 끄기"} className="rounded-full bg-black/35 p-1.5 text-amber-50" onClick={() => { setMuted(!muted); setMute(!muted); }}>
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>

        {/* 상호작용 안내 */}
        {phase === "explore" && !talk && near && (
          <button type="button" onClick={interact} className="absolute bottom-[54%] left-1/2 z-30 -translate-x-1/2 animate-bounce rounded-full bg-amber-100/90 px-3 py-1 text-sm font-bold text-indigo-950">
            SPACE · {near.label}
          </button>
        )}

        {/* 대사 / 질문 */}
        {talk && (line || asking) && (
          <div className="absolute inset-x-3 bottom-3 z-30 rounded-xl bg-indigo-950/90 p-3 text-indigo-50 ring-1 ring-amber-200/30" data-testid="dialogue">
            <p className="text-xs font-bold text-amber-200">✦ 별의 아이</p>
            {line ? (
              <button type="button" onClick={advance} className="block w-full text-left">
                <p className="min-h-6 leading-relaxed">{line.slice(0, typed)}</p>
                <p className="text-right text-[10px] text-indigo-300">{fullyTyped ? "SPACE ▶" : "SPACE 건너뛰기"}</p>
              </button>
            ) : (
              asking && (
                <div className="space-y-2">
                  <p className="font-medium leading-relaxed" data-testid="question">{talk.ask!.question}</p>
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          submitAnswer();
                        }
                      }}
                      rows={2}
                      maxLength={1000}
                      disabled={waiting}
                      placeholder="자유롭게 적어 줘. 짧아도 괜찮아. (Enter 보내기)"
                      aria-label="나의 대답"
                      className="min-h-12 flex-1 resize-none rounded-lg bg-white/10 p-2 text-sm text-white outline-none ring-1 ring-white/20 placeholder:text-indigo-300 focus:ring-amber-200/60"
                    />
                    <Button size="icon-lg" onClick={submitAnswer} disabled={waiting} aria-label="대답 보내기">
                      {waiting ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* 별의 아이가 사라진 뒤 */}
        {phase === "letterDrop" && (
          <p className="absolute inset-x-0 top-[22%] z-30 text-center text-lg font-medium text-amber-50" style={{ textShadow: "0 0 12px #000" }}>
            편지를 확인하려면 마우스로 눌러 주세요.
          </p>
        )}

        {/* 편지 */}
        {phase === "letter" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-indigo-950/70 p-3 backdrop-blur-sm">
            <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-[#fffaf0] p-5 text-[#4a3728] shadow-2xl ring-4 ring-amber-200/60" data-testid="letter">
              {!letter ? (
                <p className="flex items-center justify-center gap-2 py-10 text-sm"><Loader2 className="size-4 animate-spin" /> 별의 아이가 편지를 쓰고 있어…</p>
              ) : (
                <>
                  <p className="whitespace-pre-wrap font-medium leading-loose">{letter.letter}</p>
                  {(letter.facts.length > 0 || letter.discoveries.length > 0) && (
                    <div className="mt-4 grid gap-3 border-t border-amber-200 pt-3 text-xs sm:grid-cols-2">
                      <div>
                        <p className="mb-1 font-bold">✦ 네가 직접 들려준 것</p>
                        <ul className="list-disc space-y-0.5 pl-4">{letter.facts.map((f, i) => <li key={i}>{f}</li>)}</ul>
                      </div>
                      {letter.discoveries.length > 0 && (
                        <div>
                          <p className="mb-1 font-bold">✧ 별의 아이가 발견한 것</p>
                          <ul className="list-disc space-y-0.5 pl-4">{letter.discoveries.map((f, i) => <li key={i}>{f}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="mt-3 text-right text-[10px] text-[#8a7360]">{letter.source === "demo" ? "⚪ AI 미연결 — 답변을 모은 기본 편지" : letter.source === "tilon" ? "🟢 틸론 GPU가 쓴 편지" : "🟢 AI가 쓴 편지"}</p>
                  <div className="mt-4 flex justify-center">
                    <Button onClick={() => setPhase("capsule")}>미래의 나에게 타임캡슐 남기기</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {phase === "capsule" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-indigo-950/75 p-3 backdrop-blur-sm">
            <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl">
              <TimeCapsule letterExcerpt={letter?.letter.slice(0, 120)} onSaved={() => toast.success("타임캡슐을 묻었어요. 아래 목록에서 확인할 수 있어요.")} />
            </div>
          </div>
        )}

        {/* 시작 화면 → 조작 안내 */}
        {phase === "title" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-indigo-950/40 text-center text-amber-50">
            <p className="text-xs tracking-[0.3em] text-amber-200">AT THE END OF STARS</p>
            <h2 className="text-3xl font-black sm:text-4xl" style={{ textShadow: "0 0 20px #fde68a" }}>별의 끝에서</h2>
            <p className="max-w-sm text-sm text-indigo-100">별의 아이와 함께 걸으며, 너의 이야기를 들려줘.</p>
            <Button size="lg" onClick={() => setPhase("guide")}>시작하기</Button>
          </div>
        )}
        {phase === "guide" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-950/70 p-4 text-amber-50">
            <div className="w-full max-w-sm space-y-4 rounded-2xl bg-indigo-950/90 p-5 text-center ring-1 ring-amber-200/40" data-testid="guide">
              <p className="font-bold text-amber-100">조작 방법</p>
              <ul className="space-y-2 text-sm">
                <li><b className="rounded bg-white/15 px-2 py-0.5">W A S D</b> 캐릭터 이동</li>
                <li><b className="rounded bg-white/15 px-2 py-0.5">SPACE</b> 대화 · 텍스트 건너뛰기</li>
                <li><b className="rounded bg-white/15 px-2 py-0.5">마우스</b> 편지 확인 · 상호작용</li>
              </ul>
              <p className="text-xs text-indigo-200">질문에는 자유롭게 글로 대답해 줘. 정답은 없어.</p>
              <Button onClick={beginJourney}>여행 시작 (SPACE)</Button>
            </div>
          </div>
        )}
      </div>

      {/* 모바일 조작 */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <div className="flex gap-2">
          {[["left", "◀"], ["right", "▶"], ["up", "▲"], ["down", "▼"]].map(([k, l]) => (
            <Button key={k} variant="secondary" size="icon-lg" aria-label={k} {...hold(k)}>{l}</Button>
          ))}
        </div>
        <Button onClick={() => (talk && line ? advance() : interact())}>대화</Button>
      </div>
      {farewellStep > 0 && <span className="sr-only">작별</span>}
    </div>
  );
}

/* ---------- 그림 ---------- */

function Traveler({ moving }: { moving: boolean }) {
  return (
    <svg viewBox="0 0 70 120" className={cn("h-32 w-[74px]", moving ? "anim-walk" : "anim-breathe")} aria-label="여행자(나)">
      <defs>
        <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#475569" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <ellipse cx="35" cy="116" rx="17" ry="3.5" fill="#000" opacity=".35" />
      <path d="M35 40 C 50 42 54 80 56 110 L 14 110 C 16 80 20 42 35 40Z" fill="url(#coat)" />
      <path d="M24 46 Q 35 54 46 46 L 48 56 Q 35 62 22 56Z" fill="#f59e0b" />
      <path d="M46 52 l 8 18" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
      <circle cx="35" cy="28" r="13" fill="#fde7d4" />
      <path d="M21 28 C 20 12 50 10 49 26 C 44 20 30 18 21 28Z" fill="#3f2a1e" />
      <circle cx="31" cy="30" r="1.5" fill="#1f2937" />
      <circle cx="40" cy="30" r="1.5" fill="#1f2937" />
    </svg>
  );
}

function SpotArt({ done }: { done: boolean }) {
  return (
    <svg viewBox="-40 -50 80 90" className={cn("h-20 w-16", !done && "animate-[bounce_2.4s_infinite]")} aria-label={done ? "들려준 이야기" : "이야기의 빛"}>
      <ellipse cy="36" rx="20" ry="4" fill="#000" opacity=".3" />
      <circle r="26" fill="#fde68a" opacity={done ? 0.08 : 0.22} />
      <circle r="13" fill={done ? "#c4b5fd" : "#fffbeb"} opacity={done ? 0.5 : 1} style={{ filter: `drop-shadow(0 0 ${done ? 4 : 12}px #fde68a)` }} />
      {!done && <path d="M0 -8 Q 1.5 -1.5 8 0 Q 1.5 1.5 0 8 Q -1.5 1.5 -8 0 Q -1.5 -1.5 0 -8Z" fill="#f59e0b" />}
    </svg>
  );
}

function PortalArt({ open }: { open: boolean }) {
  return (
    <div className="relative" aria-label="다음 장소로 가는 빛">
      {open && <div className="absolute -inset-8 rounded-full bg-amber-200/40 blur-2xl" />}
      <div className={cn("relative h-44 w-24 rounded-t-full border-4", open ? "border-amber-200 bg-gradient-to-b from-amber-50/90 to-amber-300/60" : "border-indigo-300/40 bg-indigo-950/50")} />
    </div>
  );
}

function GateArt() {
  return (
    <div className="relative" aria-label="마지막 관문">
      <div className="absolute -inset-12 rounded-full bg-amber-100/30 blur-3xl" />
      <svg viewBox="0 0 160 240" className="relative h-60 w-40">
        <path d="M10 240 V 90 A 70 70 0 0 1 150 90 V 240Z" fill="none" stroke="#fde68a" strokeWidth="8" />
        <path d="M26 240 V 94 A 54 54 0 0 1 134 94 V 240Z" fill="#fffbeb" opacity=".85" />
        {[0, 1, 2, 3, 4].map((k) => (
          <circle key={k} cx={30 + k * 25} cy={60 - Math.sin((k / 4) * Math.PI) * 40} r="4" fill="#fde68a" />
        ))}
      </svg>
    </div>
  );
}

function EnvelopeArt() {
  return (
    <svg viewBox="0 0 80 60" className="h-14 w-20" style={{ filter: "drop-shadow(0 0 14px #fde68a)" }}>
      <rect x="4" y="8" width="72" height="48" rx="4" fill="#fffaf0" stroke="#d6b77a" strokeWidth="2" />
      <path d="M4 10 L40 36 L76 10" fill="none" stroke="#d6b77a" strokeWidth="2" />
      <path d="M40 30 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1z" fill="#f59e0b" />
    </svg>
  );
}
