"use client";

// 《별의 끝에서》 2.5D 탐험 데모 — 별의 집 → 잊혀진 정원 → 엔딩
import { Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ENDING,
  GARDEN_FRAGMENT,
  GARDEN_OBJECTS,
  HOUSE_OBJECTS,
  type Line,
  PROLOGUE,
  RADIO_RESTORED,
  SHADOW_TOUCH,
  SPEAKER_LABEL,
  type StageId,
  WORLD_WIDTH,
  type WorldObject,
} from "@/lib/play/story";
import { cn } from "@/lib/utils";
import { playChime, playResolve, playShadow, setMuted, startAmbient, stopAmbient } from "./audio";
import { LightPuzzle, RadioPuzzle } from "./puzzles";

type Phase = "title" | "explore" | "radio" | "light" | "ending" | "credits";
interface Pos {
  x: number;
  lane: number;
  facing: 1 | -1;
  moving: boolean;
  t: number;
}

const SPEED = 260; // px/초
const LANE_SPEED = 0.9;

// 고정된 별 배치 (매번 같은 하늘)
const STARS = Array.from({ length: 48 }, (_, i) => ({
  left: (i * 47) % 100,
  top: (i * 29) % 62,
  size: 1 + (i % 3),
  delay: (i % 7) * 0.4,
}));

function shadowX(base: number, t: number, i: number) {
  return base + Math.sin(t * 0.9 + i * 2) * 170;
}

export function StarsGame({ coCreated }: { coCreated?: string }) {
  const [phase, setPhase] = useState<Phase>("title");
  const [stage, setStage] = useState<StageId>("house");
  const [pos, setPos] = useState<Pos>({ x: 120, lane: 0.5, facing: 1, moving: false, t: 0 });
  const [collected, setCollected] = useState<string[]>([]);
  const [flags, setFlags] = useState({ memoryRestored: false, lightSolved: false });
  const [dialogue, setDialogue] = useState<{ lines: Line[]; i: number; after?: () => void } | null>(null);
  const [hurt, setHurt] = useState(0); // 그림자에 닿은 횟수
  const [dark, setDark] = useState(false);
  const [muted, setMute] = useState(false);
  const [viewW, setViewW] = useState(800);
  const [endingStep, setEndingStep] = useState(0);

  const keys = useRef(new Set<string>());
  const posRef = useRef(pos);
  const viewRef = useRef<HTMLDivElement>(null);
  const hurtUntil = useRef(0);

  const fragments = collected.filter((id) => id.startsWith("f")).length;
  const hope = fragments / 4; // 희망 0~1 → 조명·색 변화

  const objects: WorldObject[] =
    stage === "house"
      ? HOUSE_OBJECTS
      : [
          ...GARDEN_OBJECTS,
          ...(coCreated
            ? [{ id: "co", kind: "memory", x: 1100, lane: 0.25, label: "함께 만든 기억", lines: [{ speaker: "memory", text: `(공동창작) ${coCreated}` }] } as WorldObject]
            : []),
          ...(flags.lightSolved && !collected.includes("f4")
            ? [{ id: "f4", kind: "fragment", x: 2380, lane: 0.5, label: "마지막 별 조각" } as WorldObject]
            : []),
        ];

  const say = useCallback((lines: Line[], after?: () => void) => setDialogue({ lines, i: 0, after }), []);

  // 화면 폭 측정
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setViewW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 이동 루프
  const paused = phase !== "explore" || dialogue !== null;
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
      let x = Math.max(40, Math.min(WORLD_WIDTH[stage] - 40, p.x + dx * SPEED * dt));
      const lane = Math.max(0, Math.min(1, p.lane + dl * LANE_SPEED * dt));
      const t = p.t + dt;

      // 그림자: 닿으면 뒤로 밀리고 어두워짐 (전투 없음)
      if (stage === "garden" && now > hurtUntil.current) {
        GARDEN_OBJECTS.filter((o) => o.kind === "shadow").forEach((s, i) => {
          if (Math.abs(x - shadowX(s.x, t, i)) < 55 && Math.abs(lane - 0.5) < 0.35) {
            x = Math.max(40, x - 160);
            hurtUntil.current = now + 1500;
            playShadow();
            setHurt((h) => h + 1);
            setDark(true);
          }
        });
      }
      const next: Pos = { x, lane, t, facing: dx ? (dx > 0 ? 1 : -1) : p.facing, moving: dx !== 0 || dl !== 0 };
      posRef.current = next;
      setPos(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, stage]);

  // 그림자에 닿은 직후 혼잣말
  useEffect(() => {
    if (!hurt) return;
    const t = setTimeout(() => {
      setDark(false);
      say(SHADOW_TOUCH);
    }, 700);
    return () => clearTimeout(t);
  }, [hurt, say]);

  const near = objects.find(
    (o) => o.kind !== "shadow" && Math.abs(o.x - pos.x) < 80 && Math.abs(o.lane - pos.lane) < 0.4 && !collected.includes(o.id)
  );

  const interact = () => {
    if (!near) return;
    switch (near.kind) {
      case "fragment":
        playChime();
        setCollected((c) => [...c, near.id]);
        if (near.id === "f4") say(GARDEN_FRAGMENT, () => setPhase("ending"));
        else say([{ speaker: "system", text: `별 조각을 얻었다. (${fragments + 1}/4)` }, ...(near.lines ?? [])]);
        break;
      case "radio":
        if (flags.memoryRestored) say([{ speaker: "radio", text: "…지지직. 목소리는 이미 문 너머로 사라졌다." }]);
        else if (fragments < 3) say([{ speaker: "radio", text: "…지지직. 잡음뿐이다. 별 조각이 더 있으면 들릴 것 같다." }]);
        else setPhase("radio");
        break;
      case "door":
        if (!flags.memoryRestored) say([{ speaker: "system", text: "문이 굳게 닫혀 있다. 라디오가 무언가를 말하려는 것 같다." }]);
        else {
          playResolve();
          setStage("garden");
          posRef.current = { ...posRef.current, x: 120, lane: 0.5 };
          setPos(posRef.current);
          say([{ speaker: "system", text: "STAGE 2 — 잊혀진 정원" }]);
        }
        break;
      case "memory":
        say(near.lines ?? []);
        break;
      case "altar":
        if (!flags.lightSolved) setPhase("light");
        break;
    }
  };

  const advance = () => {
    setDialogue((d) => {
      if (!d) return d;
      if (d.i + 1 < d.lines.length) return { ...d, i: d.i + 1 };
      d.after?.();
      return null;
    });
  };

  // 키보드
  useEffect(() => {
    const map: Record<string, string> = {
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
      ArrowUp: "up", w: "up", W: "up",
      ArrowDown: "down", s: "down", S: "down",
    };
    const down = (e: KeyboardEvent) => {
      if (phase === "title" || phase === "radio" || phase === "light" || phase === "credits") return;
      if (map[e.key]) {
        e.preventDefault();
        keys.current.add(map[e.key]);
      } else if (e.key === " " || e.key === "e" || e.key === "E" || e.key === "Enter") {
        e.preventDefault();
        if (e.repeat) return;
        if (phase === "ending") setEndingStep((s) => Math.min(ENDING.length, s + 1));
        else if (dialogue) advance();
        else interact();
      }
    };
    const up = (e: KeyboardEvent) => map[e.key] && keys.current.delete(map[e.key]);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, dialogue, advance, interact]);

  useEffect(() => () => stopAmbient(), []);
  useEffect(() => {
    if (phase === "ending" && endingStep >= ENDING.length) {
      const t = setTimeout(() => setPhase("credits"), 2500);
      return () => clearTimeout(t);
    }
  }, [phase, endingStep]);

  function start() {
    startAmbient();
    setPhase("explore");
    say([{ speaker: "system", text: "PROLOGUE — 별빛의 시작" }, ...PROLOGUE, { speaker: "system", text: "STAGE 1 — 별의 집" }]);
  }

  function restart() {
    setStage("house");
    setCollected([]);
    setFlags({ memoryRestored: false, lightSolved: false });
    setEndingStep(0);
    posRef.current = { x: 120, lane: 0.5, facing: 1, moving: false, t: 0 };
    setPos(posRef.current);
    start();
  }

  const W = WORLD_WIDTH[stage];
  const cam = Math.max(0, Math.min(W - viewW, pos.x - viewW / 2));
  const laneBottom = (lane: number) => `${10 + lane * 24}%`;
  const laneScale = (lane: number) => 1 - lane * 0.35;
  const line = dialogue?.lines[dialogue.i];
  const dissolve = phase === "ending" && endingStep >= 5;

  // 손가락 조작 버튼
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
        data-stage={stage}
        data-phase={phase}
        data-fragments={fragments}
        data-x={Math.round(pos.x)}
        data-lane={pos.lane.toFixed(2)}
        className="relative aspect-[16/10] w-full touch-none select-none overflow-hidden rounded-2xl bg-indigo-950 sm:aspect-video"
      >
        {/* 하늘 (희망에 따라 밝아짐) */}
        <div
          className="absolute inset-0 transition-[filter] duration-1000"
          style={{
            background:
              stage === "house"
                ? "linear-gradient(180deg,#1e1b4b 0%,#3b2a6b 55%,#6d4c8f 100%)"
                : "linear-gradient(180deg,#2e1f5e 0%,#6b4c9a 50%,#e8b98a 100%)",
            filter: `brightness(${0.65 + hope * 0.45}) saturate(${0.7 + hope * 0.5})`,
          }}
        />
        {STARS.slice(0, 18 + Math.round(hope * 30)).map((s, i) => (
          <span
            key={i}
            className="absolute animate-pulse rounded-full bg-amber-50"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s`, boxShadow: "0 0 6px #fef3c7" }}
          />
        ))}

        {/* 먼 배경 (시차 0.2) */}
        <div className="absolute inset-0" style={{ transform: `translateX(${-cam * 0.2}px)` }}>
          <div className="absolute left-[60%] top-[10%] size-24 rounded-full bg-amber-100/80 blur-[2px]" style={{ boxShadow: "0 0 60px 20px rgba(254,243,199,.35)" }} />
          <div className="absolute left-[10%] top-[30%] h-10 w-72 rounded-full bg-violet-200/20 blur-xl" />
          <div className="absolute left-[120%] top-[22%] h-12 w-96 rounded-full bg-pink-200/20 blur-xl" />
        </div>

        {/* 중간 배경 (시차 0.55): 장소별 실루엣 */}
        <div className="absolute inset-0" style={{ transform: `translateX(${-cam * 0.55}px)` }}>
          {Array.from({ length: 8 }, (_, i) =>
            stage === "house" ? (
              <div key={i} className="absolute bottom-[34%] h-[38%] w-28 rounded-t-full border-4 border-amber-100/20 bg-indigo-900/40" style={{ left: i * 260 + 60 }}>
                <div className="mx-auto mt-6 size-10 rounded-full bg-amber-200/40 blur-[1px]" />
              </div>
            ) : (
              <div key={i} className="absolute bottom-[34%]" style={{ left: i * 280 + 40 }}>
                <div className="h-40 w-36 rounded-t-full border-[6px] border-emerald-100/25" />
                <div className="-mt-3 flex gap-2">
                  {[0, 1, 2].map((k) => (
                    <span key={k} className="size-4 rounded-full bg-pink-200/50 blur-[1px]" />
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* 바닥 */}
        <div className="absolute inset-x-0 bottom-0 h-[38%]" style={{ background: stage === "house" ? "linear-gradient(180deg,#4c3a7a,#2a1f4d)" : "linear-gradient(180deg,#5f7a8a,#2f3f5a)" }} />

        {/* 월드 (오브젝트 + 주인공) */}
        <div className="absolute inset-0" style={{ transform: `translateX(${-cam}px)` }}>
          {objects.map((o, i) => {
            const isShadow = o.kind === "shadow";
            const done = collected.includes(o.id);
            if (done && o.kind === "fragment") return null;
            const x = isShadow ? shadowX(o.x, pos.t, GARDEN_OBJECTS.filter((g) => g.kind === "shadow").indexOf(o)) : o.x;
            return (
              <div
                key={o.id + i}
                data-object={o.id}
                className="absolute -translate-x-1/2"
                style={{ left: x, bottom: laneBottom(o.lane), zIndex: Math.round((1 - o.lane) * 10), transform: `translateX(-50%) scale(${laneScale(o.lane)})`, transformOrigin: "bottom" }}
              >
                <ObjectArt kind={o.kind} open={o.kind === "door" ? flags.memoryRestored : flags.lightSolved} />
              </div>
            );
          })}

          {/* 주인공: 별빛 아이 */}
          <div
            className="absolute"
            style={{ left: pos.x, bottom: laneBottom(pos.lane), zIndex: Math.round((1 - pos.lane) * 10) + 1, transform: `translateX(-50%) scale(${laneScale(pos.lane) * pos.facing}, ${laneScale(pos.lane)})`, transformOrigin: "bottom" }}
          >
            <StarChild moving={pos.moving} dissolve={dissolve} />
          </div>
        </div>

        {/* 수채화 질감 + 비네트 */}
        <svg className="pointer-events-none absolute inset-0 size-full opacity-[0.18] mix-blend-soft-light" aria-hidden>
          <filter id="paper">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" />
          </filter>
          <rect width="100%" height="100%" filter="url(#paper)" />
        </svg>
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(15,10,40,0.8)]" />
        {dark && <div className="pointer-events-none absolute inset-0 bg-black/40 transition" />}

        {/* HUD */}
        {phase !== "title" && phase !== "credits" && (
          <div className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs text-amber-50">
            <span>{stage === "house" ? "별의 집" : "잊혀진 정원"}</span>
            <span aria-label={`별 조각 ${fragments}개`}>{"✦".repeat(fragments)}{"·".repeat(4 - fragments)}</span>
          </div>
        )}
        <button
          type="button"
          aria-label={muted ? "소리 켜기" : "소리 끄기"}
          className="absolute right-3 top-3 z-30 rounded-full bg-black/30 p-1.5 text-amber-50"
          onClick={() => {
            setMuted(!muted);
            setMute(!muted);
          }}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>

        {/* 상호작용 안내 */}
        {phase === "explore" && !dialogue && near && (
          <button type="button" onClick={interact} className="absolute bottom-[52%] left-1/2 z-30 -translate-x-1/2 animate-bounce rounded-full bg-amber-100/90 px-3 py-1 text-sm font-bold text-indigo-950">
            Space · {near.label}
          </button>
        )}

        {/* 대사창 */}
        {line && (
          <button type="button" onClick={advance} className="absolute inset-x-3 bottom-3 z-30 rounded-xl bg-indigo-950/85 p-3 text-left text-indigo-50 ring-1 ring-amber-200/30" data-testid="dialogue">
            {SPEAKER_LABEL[line.speaker] && <p className="text-xs font-bold text-amber-200">{SPEAKER_LABEL[line.speaker]}</p>}
            <p className={cn("leading-relaxed", line.speaker === "system" && "text-center text-sm text-indigo-200")}>{line.text}</p>
            <p className="text-right text-[10px] text-indigo-300">Space ▶</p>
          </button>
        )}

        {/* 퍼즐 */}
        {phase === "radio" && (
          <RadioPuzzle
            onSolved={() => {
              setFlags((f) => ({ ...f, memoryRestored: true }));
              setPhase("explore");
              say(RADIO_RESTORED);
            }}
          />
        )}
        {phase === "light" && (
          <LightPuzzle
            onSolved={() => {
              setFlags((f) => ({ ...f, lightSolved: true }));
              setPhase("explore");
              say([{ speaker: "system", text: "빛이 수정에 닿자, 정원 끝에서 마지막 별 조각이 떠올랐다." }]);
            }}
          />
        )}

        {/* 엔딩 */}
        {phase === "ending" && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-end bg-gradient-to-b from-indigo-950/70 via-violet-900/60 to-amber-200/40 p-4 pb-6" onClick={() => setEndingStep((s) => Math.min(ENDING.length, s + 1))}>
            <div className={cn("mb-auto mt-[8%] text-6xl text-amber-100 transition-all duration-[2500ms]", endingStep >= 4 && "-translate-y-24 scale-50 opacity-70")} style={{ filter: "drop-shadow(0 0 24px #fde68a)" }}>
              ✦
            </div>
            <div className="w-full max-w-lg rounded-xl bg-indigo-950/80 p-4 text-center text-indigo-50 ring-1 ring-amber-200/30" data-testid="ending-line">
              {endingStep === 0 ? (
                <p className="text-sm text-indigo-200">ENDING — 별의 끝에서 (Space ▶)</p>
              ) : (
                <>
                  {SPEAKER_LABEL[ENDING[Math.min(endingStep, ENDING.length) - 1].speaker] && (
                    <p className="text-xs font-bold text-amber-200">{SPEAKER_LABEL[ENDING[endingStep - 1].speaker]}</p>
                  )}
                  <p className="text-lg">{ENDING[Math.min(endingStep, ENDING.length) - 1].text}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* 타이틀 */}
        {phase === "title" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-indigo-950/40 text-center text-amber-50">
            <p className="text-xs tracking-[0.3em] text-amber-200">AT THE END OF STARS</p>
            <h2 className="text-3xl font-black sm:text-4xl" style={{ textShadow: "0 0 20px #fde68a" }}>
              별의 끝에서
            </h2>
            <p className="max-w-sm text-sm text-indigo-100">&ldquo;사라진 사람의 이야기를, 남은 별빛으로 전하고 싶었다.&rdquo;</p>
            <Button size="lg" onClick={start}>
              시작하기
            </Button>
          </div>
        )}

        {/* 크레딧 */}
        {phase === "credits" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-indigo-950/90 text-center text-amber-50">
            <p className="text-2xl font-black">별의 끝에서</p>
            <p className="text-sm text-indigo-200">데모 끝 · 한끗차이 공동창작 PLAY</p>
            <div className="flex gap-2">
              <Button onClick={restart}>다시 하기</Button>
              <Link href="/create" className={buttonVariants({ variant: "secondary" })}>
                공동창작으로
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 모바일 조작 */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <div className="flex gap-2">
          {[
            ["left", "◀"],
            ["right", "▶"],
            ["up", "▲"],
            ["down", "▼"],
          ].map(([k, l]) => (
            <Button key={k} variant="secondary" size="icon-lg" aria-label={k} {...hold(k)}>
              {l}
            </Button>
          ))}
        </div>
        <Button onClick={() => (dialogue ? advance() : phase === "ending" ? setEndingStep((s) => Math.min(ENDING.length, s + 1)) : interact())}>살펴보기</Button>
      </div>
    </div>
  );
}

/* ---------- 그림 ---------- */

function StarChild({ moving, dissolve }: { moving: boolean; dissolve: boolean }) {
  return (
    <div className={cn("relative transition-all duration-[3000ms]", dissolve && "scale-125 opacity-0 blur-md")}>
      <svg viewBox="0 0 60 90" className={cn("h-24 w-16", moving && "animate-[bounce_0.6s_infinite]")} aria-label="별빛 아이">
        <defs>
          <radialGradient id="glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="70%" stopColor="#fde68a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="30" cy="86" rx="14" ry="3" fill="#000" opacity="0.25" />
        <circle cx="30" cy="40" r="28" fill="url(#glow)" opacity="0.6" />
        <path d="M30 34 C 42 34 46 60 44 80 L 16 80 C 14 60 18 34 30 34 Z" fill="#ede9fe" stroke="#a78bfa" strokeWidth="1.5" />
        <circle cx="30" cy="26" r="13" fill="#fffbeb" stroke="#a78bfa" strokeWidth="1.5" />
        <circle cx="25" cy="27" r="1.6" fill="#4c1d95" />
        <circle cx="35" cy="27" r="1.6" fill="#4c1d95" />
        <path d="M30 2 L33 10 L41 11 L35 16 L37 24 L30 20 L23 24 L25 16 L19 11 L27 10 Z" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
      </svg>
      {dissolve && (
        <div className="absolute inset-0">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="absolute size-1.5 animate-ping rounded-full bg-amber-100" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ObjectArt({ kind, open }: { kind: WorldObject["kind"]; open: boolean }) {
  switch (kind) {
    case "fragment":
      return (
        <div className="animate-[bounce_2s_infinite] text-4xl text-amber-200" style={{ filter: "drop-shadow(0 0 12px #fde68a)" }} aria-label="별 조각">
          ✦
        </div>
      );
    case "radio":
      return (
        <svg viewBox="0 0 60 44" className="h-12 w-16" aria-label="라디오">
          <rect x="4" y="12" width="52" height="30" rx="6" fill="#a16207" stroke="#451a03" strokeWidth="2" />
          <circle cx="20" cy="27" r="8" fill="#fde68a" stroke="#451a03" strokeWidth="2" />
          <rect x="34" y="20" width="16" height="4" rx="2" fill="#451a03" />
          <rect x="34" y="28" width="16" height="4" rx="2" fill="#451a03" />
          <path d="M14 12 L30 2" stroke="#451a03" strokeWidth="2" />
        </svg>
      );
    case "door":
      return (
        <div className={cn("h-40 w-24 rounded-t-full border-4", open ? "border-amber-200 bg-amber-100/60 shadow-[0_0_40px_#fde68a]" : "border-indigo-300/50 bg-indigo-950/70")} aria-label="문" />
      );
    case "memory":
      return (
        <div className="animate-pulse text-3xl" style={{ filter: "drop-shadow(0 0 10px #f9a8d4)" }} aria-label="기억">
          ❀
        </div>
      );
    case "altar":
      return (
        <div className="flex flex-col items-center" aria-label="빛의 제단">
          <div className={cn("text-4xl", open ? "text-amber-200 drop-shadow-[0_0_16px_#fde68a]" : "text-violet-300")}>◆</div>
          <div className="h-12 w-14 rounded-t-lg bg-slate-300/40" />
        </div>
      );
    case "shadow":
      return (
        <div className="relative h-24 w-20 rounded-t-full bg-black/70 blur-[3px]" aria-label="그림자">
          <span className="absolute left-5 top-8 size-1.5 rounded-full bg-violet-300/70" />
          <span className="absolute right-5 top-8 size-1.5 rounded-full bg-violet-300/70" />
        </div>
      );
  }
}
