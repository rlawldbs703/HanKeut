"use client";

// 《별의 끝에서》 — 플레이어 = 기억을 잃은 별의 아이. 장소마다 기억을 떠올리고, 관문 미니게임을 풀며 별빛 세계를 여행한다.
import { Loader2, Maximize, RotateCcw, Send, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FIRST_QUESTION, REGIONS, type Spot, type Theme } from "@/lib/journey/regions";
import type { Exchange, LetterResult } from "@/lib/journey/types";
import { saveJourneyLog } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { AiSource } from "@/types";
import { playChime, playResolve, setMuted, startAmbient, stopAmbient } from "./audio";
import { Constellation, MemoryOrder, Overlay, ShadowField } from "./minigames";
import { LightPuzzle } from "./puzzles";
import { Floor, Foreground, Lanterns, MidLayer, Motes, ObjectArt, Sky, StarChild, StarField } from "./scene-art";
import { TimeCapsule } from "./time-capsule";

type Phase = "title" | "guide" | "explore" | "minigame" | "ending" | "letterDrop" | "letter" | "capsule";
type Speaker = "whisper" | "me" | "system";
interface Line { who: Speaker; text: string }
interface Ask { question: string; spotId: string | null; turn: number }
interface Talk { queue: Line[]; ask?: Ask; onDone?: () => void }
interface Body { x: number; lane: number; vx: number; vl: number; flip: number; cam: number }

// 움직임: 가속·감속·달리기
const ACCEL = 1500, FRICTION = 2000, WALK = 230, RUN = 420, LANE_MAX = 0.85;
const STAGE: Record<Theme, "house" | "garden"> = { house: "house", garden: "garden", plain: "garden", attic: "house", hall: "garden" };
const FILTER: Record<Theme, string> = {
  house: "none",
  garden: "none",
  plain: "saturate(0.55) hue-rotate(-30deg) brightness(0.8)",
  attic: "sepia(0.45) saturate(1.1) brightness(0.9)",
  hall: "hue-rotate(20deg) saturate(1.25) brightness(1.1)",
};
const HOUSE_FRAGMENTS = [
  { id: "hf1", x: 330, lane: 0.85 },
  { id: "hf2", x: 860, lane: 0.1 },
  { id: "hf3", x: 1500, lane: 0.9 },
];
const SPEAKER: Record<Speaker, string> = { whisper: "✦ 별빛의 속삭임", me: "나 (별의 아이)", system: "" };

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "잠시 후 다시 시도해 주세요.");
  return d as T;
}

export function JourneyGame() {
  const [phase, setPhase] = useState<Phase>("title");
  const [regionIdx, setRegionIdx] = useState(0);
  const [view, setView] = useState({ x: 140, lane: 0.5, speed: 0, flip: 1, cam: 0, tilt: 0 });
  const [hop, setHop] = useState(0);
  const [talk, setTalk] = useState<Talk | null>(null);
  const [typed, setTyped] = useState(0);
  const [answer, setAnswer] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [history, setHistory] = useState<Exchange[]>([]);
  const [doneSpots, setDoneSpots] = useState<string[]>([]);
  const [houseFrags, setHouseFrags] = useState<string[]>([]);
  const [source, setSource] = useState<AiSource | null>(null);
  const [letter, setLetter] = useState<(LetterResult & { source: AiSource }) | null>(null);
  const [letterError, setLetterError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [dissolve, setDissolve] = useState(false);
  const [muted, setMute] = useState(false);
  const [viewW, setViewW] = useState(900);

  const keys = useRef(new Set<string>());
  const body = useRef<Body>({ x: 140, lane: 0.5, vx: 0, vl: 0, flip: 1, cam: 0 });
  const viewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const region = REGIONS[regionIdx];
  const stage = STAGE[region.theme];
  const hope = Math.min(1, (regionIdx + doneSpots.filter((id) => region.spots.some((s) => s.id === id)).length / 3) / 4);
  const spotsDone = region.spots.every((s) => doneSpots.includes(s.id));
  const line = talk?.queue[0];
  const fullyTyped = line ? typed >= line.text.length : true;
  const asking = talk && talk.queue.length === 0 ? talk.ask : undefined;

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setViewW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!line) return;
    const id = setInterval(() => setTyped((n) => (n >= line.text.length ? n : n + 1)), 26);
    return () => clearInterval(id);
  }, [line]);

  useEffect(() => {
    if (asking) inputRef.current?.focus();
  }, [asking]);

  // 이동 루프: 가속/감속, 방향 전환(뒤집힘 보간), 카메라 부드럽게 따라가기
  const paused = phase !== "explore" || talk !== null;
  // 루프는 한 번만 돌고, 바뀌는 값은 live ref로 읽어요 (프레임마다 루프를 다시 만들지 않음)
  const live = useRef({ paused, width: region.width, house: region.theme === "house", viewW, collect: ((id: string) => void id) as (id: string) => void });
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const b = body.current;
      const k = keys.current;
      const { paused, viewW, width, house, collect } = live.current;
      const ix = paused ? 0 : (k.has("right") ? 1 : 0) - (k.has("left") ? 1 : 0);
      const il = paused ? 0 : (k.has("up") ? 1 : 0) - (k.has("down") ? 1 : 0);
      const max = k.has("run") ? RUN : WALK;
      const approach = (v: number, target: number, rate: number) => (v < target ? Math.min(target, v + rate * dt) : Math.max(target, v - rate * dt));
      b.vx = approach(b.vx, ix * max, ix ? ACCEL : FRICTION);
      b.vl = approach(b.vl, il * LANE_MAX, il ? 4 : 5);
      b.x = Math.max(60, Math.min(width - 60, b.x + b.vx * dt));
      if (b.x <= 60 || b.x >= width - 60) b.vx = 0;
      b.lane = Math.max(0, Math.min(1, b.lane + b.vl * dt));
      if (ix) b.flip += (ix - b.flip) * Math.min(1, dt * 14);
      const target = Math.max(0, Math.min(width - viewW, b.x - viewW * 0.45 + b.vx * 0.25));
      b.cam += (target - b.cam) * Math.min(1, dt * 4.5);
      setView({ x: b.x, lane: b.lane, speed: Math.hypot(b.vx, b.vl * 300), flip: b.flip, cam: b.cam, tilt: (b.vx / RUN) * 7 });

      // 별의 집: 걸어서 지나가면 별 조각 수집
      if (house && !paused) {
        const f = HOUSE_FRAGMENTS.find((f) => Math.abs(f.x - b.x) < 50 && Math.abs(f.lane - b.lane) < 0.25);
        if (f) collect(f.id);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function collectFragment(id: string) {
    setHouseFrags((fs) => {
      if (fs.includes(id)) return fs;
      playChime();
      const n = fs.length + 1;
      setTimeout(() => say([{ who: "me", text: n < 3 ? `반짝… 별 조각이야. (${n}/3) 조각에 따뜻한 무언가가 묻어 있어.` : "세 번째 조각! 이제 문을 열 수 있을 것 같아." }]), 0);
      return [...fs, id];
    });
  }

  function say(queue: Line[], opts: Omit<Talk, "queue"> = {}) {
    setTyped(0);
    setTalk({ queue, ...opts });
  }

  useEffect(() => {
    live.current = { paused, width: region.width, house: region.theme === "house", viewW, collect: collectFragment };
  });

  function advance() {
    if (!talk || !line) return;
    if (!fullyTyped) return setTyped(line.text.length);
    const rest = talk.queue.slice(1);
    setTyped(0);
    if (rest.length || talk.ask) setTalk({ ...talk, queue: rest });
    else {
      setTalk(null);
      talk.onDone?.();
    }
  }

  function finishSpot(spot: Spot | null) {
    if (!spot) return say([{ who: "system", text: `— ${REGIONS[0].name} —` }, { who: "me", text: REGIONS[0].intro }]);
    const nowDone = [...doneSpots, spot.id];
    setDoneSpots(nowDone);
    playChime();
    const all = region.spots.every((s) => nowDone.includes(s.id));
    say([{ who: "me", text: all ? `이곳의 기억이 조금 돌아왔어. ${region.gate.label}(으)로 가 보자.` : "다른 곳에도 기억이 남아 있는 것 같아." }]);
  }

  async function submitAnswer(skipAi = false) {
    if (!talk?.ask || waiting) return;
    const ask = talk.ask;
    const text = answer.trim();
    if (!text) return toast.info("짧게라도 괜찮아. 떠오르는 대로 적어 줘.");
    const spot = region.spots.find((s) => s.id === ask.spotId) ?? null;
    const regionName = spot ? region.name : "깨어난 곳";
    const record = (reply: string) => {
      const next = [...history, { region: regionName, question: ask.question, answer: text, reply }];
      setHistory(next);
      saveJourneyLog(next); // 기록 저장 → 편지 생성에 사용
      setAnswer("");
      setAiError(null);
    };
    if (skipAi) {
      record("");
      setTalk(null);
      return finishSpot(spot);
    }
    setWaiting(true);
    try {
      const d = await post<{ reply: string; followUp: string | null; source: AiSource }>("/api/journey/reply", {
        regionId: spot ? region.id : "intro",
        topic: spot ? region.topic : "깨어난 별의 아이의 자기소개",
        question: ask.question,
        answer: text,
        turnInSpot: ask.turn,
        history,
      });
      setSource(d.source);
      record(d.reply);
      say([{ who: "whisper", text: d.reply }], {
        onDone: () =>
          d.followUp && ask.turn === 0
            ? say([], { ask: { question: d.followUp, spotId: ask.spotId, turn: 1 } })
            : finishSpot(spot),
      });
    } catch (e) {
      setAiError((e as Error).message);
    } finally {
      setWaiting(false);
    }
  }

  /** 답하고 싶지 않은 물음은 건너뛰기 (기록하지 않음) */
  function skipQuestion() {
    if (!talk?.ask) return;
    const spot = region.spots.find((s) => s.id === talk.ask!.spotId) ?? null;
    setAnswer("");
    setAiError(null);
    setTalk(null);
    finishSpot(spot);
  }

  // 월드 오브젝트
  const objects = [
    ...region.spots.filter((s) => !doneSpots.includes(s.id)).map((s) => ({ id: s.id, kind: "spot" as const, x: s.x, lane: s.lane, label: s.label, spot: s })),
    { id: "gate", kind: "gate" as const, x: region.gate.x, lane: 0.5, label: region.gate.label, spot: undefined },
  ];
  const near = objects.find((o) => Math.abs(o.x - view.x) < 85 && Math.abs(o.lane - view.lane) < 0.45);

  function interact() {
    if (!near) return;
    setHop((h) => h + 1);
    if (near.kind === "spot" && near.spot) {
      return say([{ who: "me", text: `${near.label}… 어딘가 익숙해.` }], { ask: { question: near.spot.seed, spotId: near.spot.id, turn: 0 } });
    }
    if (!spotsDone) return say([{ who: "me", text: "아직 이곳에서 떠올릴 기억이 남아 있어. 반짝이는 곳을 먼저 둘러보자." }]);
    if (region.gate.minigame === "fragments" && houseFrags.length < 3)
      return say([{ who: "me", text: `문에 별 모양 홈이 세 개 있어. 조각이 더 필요해. (${houseFrags.length}/3) 구석구석 걸어 보자.` }]);
    if (region.gate.minigame === "fragments") return passGate();
    if (region.gate.minigame === "constellation") fetchLetter();
    setPhase("minigame");
  }

  function passGate() {
    playResolve();
    setPhase("explore");
    if (regionIdx === REGIONS.length - 1) return startEnding();
    const next = regionIdx + 1;
    setRegionIdx(next);
    body.current = { ...body.current, x: 140, lane: 0.5, vx: 0, vl: 0, cam: 0 };
    say([{ who: "system", text: `— ${REGIONS[next].name} —` }, { who: "me", text: REGIONS[next].intro }]);
  }

  function fetchLetter() {
    setLetterError(null);
    post<LetterResult & { source: AiSource }>("/api/journey/letter", { history })
      .then(setLetter)
      .catch((e) => setLetterError((e as Error).message));
  }

  function startEnding() {
    setPhase("ending");
    const quotes = history.filter((h) => h.answer.length > 1).slice(0, 4).map((h): Line => ({ who: "me", text: `"${h.answer.length > 40 ? h.answer.slice(0, 40) + "…" : h.answer}"` }));
    say(
      [
        { who: "system", text: "별자리가 빛나며 전당이 환해진다." },
        { who: "me", text: "…이 기억들, 전부 내 이야기였구나." },
        { who: "me", text: "나는 별빛 세계를 헤매던 별의 아이였어. 잃어버린 건 기억이 아니라, 나를 바라보는 시간이었나 봐." },
        ...(quotes.length ? [{ who: "system" as const, text: "여행에서 떠올린 말들이 별빛이 되어 떠오른다." }, ...quotes] : []),
        { who: "me", text: "이제 빛으로 돌아갈 시간이야. 그래도… 이번엔 나를 잊지 않을게." },
      ],
      {
        onDone: () => {
          setDissolve(true);
          playResolve();
          setTimeout(() => setPhase("letterDrop"), 3200);
        },
      }
    );
  }

  function beginJourney() {
    startAmbient();
    setPhase("explore");
    say([{ who: "system", text: "희미한 별빛 속에서 눈을 떴다." }], { ask: { question: FIRST_QUESTION, spotId: null, turn: 0 } });
  }

  function restart() {
    setRegionIdx(0);
    setHistory([]);
    saveJourneyLog([]);
    setDoneSpots([]);
    setHouseFrags([]);
    setLetter(null);
    setDissolve(false);
    body.current = { x: 140, lane: 0.5, vx: 0, vl: 0, flip: 1, cam: 0 };
    beginJourney();
  }

  // 키보드: WASD 이동(Shift 달리기), SPACE 대화·건너뛰기
  useEffect(() => {
    const map: Record<string, string> = { a: "left", A: "left", ArrowLeft: "left", d: "right", D: "right", ArrowRight: "right", w: "up", W: "up", ArrowUp: "up", s: "down", S: "down", ArrowDown: "down", Shift: "run" };
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || ["title", "minigame", "letter", "capsule"].includes(phase)) return;
      if (map[e.key]) {
        e.preventDefault();
        keys.current.add(map[e.key]);
      } else if (e.key === " ") {
        e.preventDefault();
        if (e.repeat) return;
        if (phase === "guide") beginJourney();
        else if (talk && line) advance();
        else if (!talk && phase === "explore") interact();
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

  const laneBottom = (l: number) => `${10 + l * 24}%`;
  const laneScale = (l: number) => 1 - l * 0.35;
  const motion = view.speed > 300 ? "anim-run" : view.speed > 25 ? "anim-walk" : "anim-breathe";
  const memoryCards = REGIONS.slice(0, 4).map((r, i) => ({
    label: ["어린 시절", "좋아하는 것", "편안한 순간", "지금과 미래"][i],
    text: history.find((h) => h.region === r.name)?.answer ?? "(흐릿한 기억)",
  }));
  const hold = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); keys.current.add(k); },
    onPointerUp: () => keys.current.delete(k),
    onPointerLeave: () => keys.current.delete(k),
  });

  return (
    <div className="space-y-3">
      <div ref={viewRef} data-testid="game" data-phase={phase} data-region={region.id} data-x={Math.round(view.x)} data-lane={view.lane.toFixed(2)} data-frags={houseFrags.length}
        className="relative aspect-[16/10] w-full touch-none select-none overflow-hidden rounded-2xl bg-indigo-950 shadow-2xl ring-1 ring-indigo-900/40 sm:aspect-video">
        {phase !== "title" && <div key={region.id} className="animate-out fade-out fill-mode-forwards pointer-events-none absolute inset-0 z-[35] bg-black duration-1000" />}

        <div className="absolute inset-0" style={{ filter: FILTER[region.theme] }}>
          <div className="absolute inset-0 transition-[filter] duration-1000" style={{ filter: `brightness(${0.72 + hope * 0.35})` }}>
            <Sky stage={stage} hope={hope} />
          </div>
          <StarField hope={hope} />
          <div className="absolute inset-0 will-change-transform" style={{ transform: `translate3d(${-view.cam * 0.55}px,0,0)` }}>
            <MidLayer stage={stage} width={region.width * 0.55 + viewW} />
            {stage === "house" && <Lanterns width={region.width * 0.55 + viewW} />}
          </div>
          <Floor stage={stage} />
          <Motes stage={stage} hope={hope} />
        </div>

        {/* 월드 */}
        <div className="absolute inset-0 will-change-transform" style={{ transform: `translate3d(${-view.cam}px,0,0)` }}>
          {region.theme === "plain" &&
            [500, 950, 1400].map((x, i) => (
              <div key={x} className="absolute opacity-60 anim-drift" style={{ left: x, bottom: laneBottom(0.7 - i * 0.2), transform: `translateX(-50%) scale(${laneScale(0.7 - i * 0.2)})`, transformOrigin: "bottom", animationDuration: `${8 + i * 3}s` }}>
                <ObjectArt kind="shadow" open={false} />
              </div>
            ))}
          {region.theme === "house" &&
            HOUSE_FRAGMENTS.filter((f) => !houseFrags.includes(f.id)).map((f) => (
              <div key={f.id} data-object={f.id} className="absolute" style={{ left: f.x, bottom: laneBottom(f.lane), zIndex: Math.round((1 - f.lane) * 10), transform: `translateX(-50%) scale(${laneScale(f.lane) * 0.7})`, transformOrigin: "bottom" }}>
                <ObjectArt kind="fragment" open={false} />
              </div>
            ))}
          {objects.map((o) => (
            <div key={o.id} data-object={o.id} className="absolute" style={{ left: o.x, bottom: laneBottom(o.lane), zIndex: Math.round((1 - o.lane) * 10), transform: `translateX(-50%) scale(${laneScale(o.lane)})`, transformOrigin: "bottom" }}>
              {o.kind === "spot" ? <ObjectArt kind="memory" open={false} /> : <GateArt kind={region.gate.minigame} open={spotsDone} />}
            </div>
          ))}
          {/* 나 = 별의 아이 */}
          {phase !== "letterDrop" && phase !== "letter" && phase !== "capsule" ? (
            <div className="absolute" style={{ left: view.x, bottom: laneBottom(view.lane), zIndex: Math.round((1 - view.lane) * 10) + 1, transform: `translateX(-50%) scale(${laneScale(view.lane) * view.flip}, ${laneScale(view.lane)}) rotate(${view.tilt}deg)`, transformOrigin: "bottom" }}>
              <div key={hop} className={hop ? "anim-hop" : undefined}>
                <div className={motion}><StarChild moving={view.speed > 25} dissolve={dissolve} /></div>
              </div>
            </div>
          ) : (
            <button type="button" aria-label="남겨진 편지 열기" onClick={() => setPhase("letter")} className="absolute animate-[bounce_2s_infinite]" style={{ left: view.x, bottom: laneBottom(view.lane), zIndex: 15, transform: "translateX(-50%)" }}>
              <EnvelopeArt />
            </button>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 will-change-transform" style={{ transform: `translate3d(${-view.cam * 1.25}px,0,0)` }}>
          <Foreground stage={stage} width={region.width * 1.25 + viewW} />
        </div>
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(15,10,40,0.8)]" />

        {/* HUD */}
        {!["title", "guide"].includes(phase) && (
          <div className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs text-amber-50">
            <span>{region.name}</span>
            <span aria-label="되찾은 별 조각">{"✦".repeat(regionIdx)}{"·".repeat(REGIONS.length - regionIdx)}</span>
            {region.theme === "house" && <span>조각 {houseFrags.length}/3</span>}
            {source === "tilon" && <span>🟢 틸론</span>}
            {source === "llm" && <span>🟢 AI</span>}
          </div>
        )}
        <div className="absolute right-3 top-3 z-30 flex gap-2">
          <button type="button" aria-label="전체화면" className="rounded-full bg-black/35 p-1.5 text-amber-50" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : viewRef.current?.requestFullscreen())}><Maximize className="size-4" /></button>
          <button type="button" aria-label={muted ? "소리 켜기" : "소리 끄기"} className="rounded-full bg-black/35 p-1.5 text-amber-50" onClick={() => { setMuted(!muted); setMute(!muted); }}>{muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}</button>
        </div>

        {phase === "explore" && !talk && near && (
          <button type="button" onClick={interact} className="absolute bottom-[54%] left-1/2 z-30 -translate-x-1/2 animate-bounce rounded-full bg-amber-100/90 px-3 py-1 text-sm font-bold text-indigo-950">SPACE · {near.label}</button>
        )}

        {/* 대사 / 물음 */}
        {talk && (line || asking) && (
          <div className="absolute inset-x-3 bottom-3 z-30 rounded-xl bg-indigo-950/90 p-3 text-indigo-50 ring-1 ring-amber-200/30" data-testid="dialogue">
            {line ? (
              <button type="button" onClick={advance} className="block w-full text-left">
                {SPEAKER[line.who] && <p className="text-xs font-bold text-amber-200">{SPEAKER[line.who]}</p>}
                <p className={cn("min-h-6 leading-relaxed", line.who === "system" && "text-center text-sm text-indigo-200")}>{line.text.slice(0, typed)}</p>
                <p className="text-right text-[10px] text-indigo-300">{fullyTyped ? "SPACE ▶" : "SPACE 건너뛰기"}</p>
              </button>
            ) : asking && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-amber-200">✦ 마음속에 떠오른 물음</p>
                <p className="font-medium leading-relaxed" data-testid="question">{asking.question}</p>
                {aiError ? (
                  <div className="space-y-2 rounded-lg bg-rose-950/60 p-2 text-sm" data-testid="ai-error">
                    <p>⚠ {aiError}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => submitAnswer()} disabled={waiting}><RotateCcw /> 다시 시도</Button>
                      <Button size="sm" variant="secondary" onClick={() => submitAnswer(true)}>AI 반응 없이 기록만 하고 계속</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <textarea ref={inputRef} value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} maxLength={1000} disabled={waiting} aria-label="나의 대답"
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submitAnswer(); } }}
                      placeholder="떠오르는 대로 자유롭게. 짧아도, 건너뛰어도 괜찮아. (Enter)"
                      className="min-h-12 flex-1 resize-none rounded-lg bg-white/10 p-2 text-sm text-white outline-none ring-1 ring-white/20 placeholder:text-indigo-300 focus:ring-amber-200/60" />
                    <Button size="icon-lg" onClick={() => submitAnswer()} disabled={waiting} aria-label="대답 보내기">{waiting ? <Loader2 className="animate-spin" /> : <Send />}</Button>
                    <Button size="sm" variant="ghost" className="text-indigo-200" onClick={skipQuestion} disabled={waiting}>건너뛰기</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 관문 미니게임 */}
        {phase === "minigame" && (
          region.gate.minigame === "light" ? <LightPuzzle onSolved={passGate} /> : (
            <Overlay title={region.gate.label} story={region.gate.story}>
              {region.gate.minigame === "shadow" && <ShadowField onSolved={passGate} />}
              {region.gate.minigame === "memory" && <MemoryOrder cards={memoryCards} onSolved={passGate} />}
              {region.gate.minigame === "constellation" && <Constellation labels={REGIONS.map((r) => r.name)} onSolved={passGate} />}
              <Button size="sm" variant="ghost" className="w-full text-indigo-200" onClick={() => setPhase("explore")}>잠시 둘러보기</Button>
            </Overlay>
          )
        )}

        {phase === "letterDrop" && (
          <p className="absolute inset-x-0 top-[22%] z-30 text-center text-lg font-medium text-amber-50" style={{ textShadow: "0 0 12px #000" }}>편지를 확인하려면 마우스로 눌러 주세요.</p>
        )}

        {phase === "letter" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-indigo-950/70 p-3 backdrop-blur-sm">
            <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-[#fffaf0] p-5 text-[#4a3728] shadow-2xl ring-4 ring-amber-200/60" data-testid="letter">
              {letter ? (
                <>
                  <p className="whitespace-pre-wrap font-medium leading-loose">{letter.letter}</p>
                  <div className="mt-4 grid gap-3 border-t border-amber-200 pt-3 text-xs sm:grid-cols-2">
                    <div><p className="mb-1 font-bold">✦ 네가 직접 들려준 것</p><ul className="list-disc space-y-0.5 pl-4">{letter.facts.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
                    {letter.discoveries.length > 0 && <div><p className="mb-1 font-bold">✧ 별빛이 발견한 것</p><ul className="list-disc space-y-0.5 pl-4">{letter.discoveries.map((f, i) => <li key={i}>{f}</li>)}</ul></div>}
                  </div>
                  <p className="mt-3 text-right text-[10px] text-[#8a7360]">{letter.source === "tilon" ? "🟢 틸론 GPU" : "🟢 AI"}가 기록된 답변으로 쓴 편지</p>
                  <div className="mt-4 flex justify-center"><Button onClick={() => setPhase("capsule")}>미래의 나에게 타임캡슐 남기기</Button></div>
                </>
              ) : letterError ? (
                <div className="space-y-3 text-center text-sm" data-testid="letter-error">
                  <p>⚠ {letterError}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={fetchLetter}><RotateCcw /> 편지 다시 받기</Button>
                    <Button variant="outline" onClick={() => setShowRaw((v) => !v)}>기록된 내 이야기 보기</Button>
                    <Button variant="outline" onClick={() => setPhase("capsule")}>타임캡슐로</Button>
                  </div>
                  {showRaw && (
                    <div className="space-y-2 text-left">
                      <p className="text-xs text-[#8a7360]">AI 편지가 아니라, 여행 중 직접 남긴 답변 기록이에요.</p>
                      {history.map((h, i) => <p key={i}><b>{h.question}</b><br />{h.answer}</p>)}
                    </div>
                  )}
                </div>
              ) : (
                <p className="flex items-center justify-center gap-2 py-10 text-sm"><Loader2 className="size-4 animate-spin" /> 별빛이 편지를 쓰고 있어…</p>
              )}
            </div>
          </div>
        )}

        {phase === "capsule" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-indigo-950/75 p-3 backdrop-blur-sm">
            <div className="max-h-full w-full max-w-xl space-y-3 overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl">
              <TimeCapsule letterExcerpt={letter?.letter.slice(0, 120)} onSaved={() => toast.success("타임캡슐을 묻었어요. 아래 목록에서 확인할 수 있어요.")} />
              <Button variant="ghost" className="w-full" onClick={restart}>처음부터 다시 여행하기</Button>
            </div>
          </div>
        )}

        {phase === "title" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-indigo-950/40 text-center text-amber-50">
            <p className="text-xs tracking-[0.3em] text-amber-200">AT THE END OF STARS</p>
            <h2 className="text-3xl font-black sm:text-4xl" style={{ textShadow: "0 0 20px #fde68a" }}>별의 끝에서</h2>
            <p className="max-w-sm text-sm text-indigo-100">기억을 잃은 별의 아이가 되어, 별빛 세계에서 나를 다시 찾아가는 여행.</p>
            <Button size="lg" onClick={() => setPhase("guide")}>시작하기</Button>
          </div>
        )}
        {phase === "guide" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-950/70 p-4 text-amber-50">
            <div className="w-full max-w-sm space-y-4 rounded-2xl bg-indigo-950/90 p-5 text-center ring-1 ring-amber-200/40" data-testid="guide">
              <p className="font-bold text-amber-100">조작 방법</p>
              <ul className="space-y-2 text-sm">
                <li><b className="rounded bg-white/15 px-2 py-0.5">W A S D</b> 이동 · <b className="rounded bg-white/15 px-2 py-0.5">Shift</b> 달리기</li>
                <li><b className="rounded bg-white/15 px-2 py-0.5">SPACE</b> 대화 · 텍스트 건너뛰기</li>
                <li><b className="rounded bg-white/15 px-2 py-0.5">마우스</b> 편지 확인 · 상호작용</li>
              </ul>
              <p className="text-xs text-indigo-200">떠오르는 물음에는 자유롭게 글로 답해 줘. 정답은 없어.</p>
              <p className="text-[11px] text-indigo-300">🔒 답변은 대화와 편지를 만들기 위해 AI 서비스로 전송되고, 기록은 이 브라우저에만 저장돼요. 이름·연락처 같은 민감한 개인정보는 적지 마세요.</p>
              <Button onClick={beginJourney}>여행 시작 (SPACE)</Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 sm:hidden">
        <div className="flex gap-2">
          {[["left", "◀"], ["right", "▶"], ["up", "▲"], ["down", "▼"]].map(([k, l]) => <Button key={k} variant="secondary" size="icon-lg" aria-label={k} {...hold(k)}>{l}</Button>)}
        </div>
        <Button onClick={() => (talk && line ? advance() : interact())}>대화</Button>
      </div>
    </div>
  );
}

function GateArt({ kind, open }: { kind: string; open: boolean }) {
  if (kind === "light") return <ObjectArt kind="altar" open={open} />;
  return (
    <div className="relative" aria-label="관문">
      {open && <div className="absolute -inset-8 rounded-full bg-amber-200/35 blur-2xl" />}
      <svg viewBox="0 0 120 200" className="relative h-48 w-28">
        <path d="M8 200 V 60 A 52 52 0 0 1 112 60 V 200Z" fill="#2a1d52" stroke="#c4a86a" strokeWidth="5" />
        <path d="M20 200 V 64 A 40 40 0 0 1 100 64 V 200Z" fill={open ? "#fef3c7" : "#1a1240"} opacity={open ? 0.9 : 1} />
        <text x="60" y="130" textAnchor="middle" fontSize="34" fill={open ? "#b45309" : "#fde68a"}>{kind === "fragments" ? "✦" : kind === "shadow" ? "◐" : kind === "memory" ? "⌛" : "✶"}</text>
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
