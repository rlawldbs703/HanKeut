"use client";

// 《별의 끝에서》 2.5D 탐험 데모 — 별의 집 → 잊혀진 정원 → 엔딩
import { Maximize, Volume2, VolumeX } from "lucide-react";
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
import { Floor, Foreground, Lanterns, MidLayer, Motes, ObjectArt, Sky, StarChild, StarField } from "./scene-art";

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
        className="relative aspect-[16/10] w-full touch-none select-none overflow-hidden rounded-2xl bg-indigo-950 shadow-2xl ring-1 ring-indigo-900/40 sm:aspect-video"
      >
        {/* 장면 전환 페이드 */}
        {phase !== "title" && <div key={stage} className="animate-out fade-out fill-mode-forwards pointer-events-none absolute inset-0 z-[35] bg-black duration-1000" />}

        {/* 하늘·성운·달빛 (희망에 따라 밝아짐) */}
        <div className="absolute inset-0 transition-[filter] duration-1000" style={{ filter: `brightness(${0.7 + hope * 0.4}) saturate(${0.75 + hope * 0.45})` }}>
          <Sky stage={stage} hope={hope} />
        </div>
        <StarField hope={hope} />

        {/* 중간 배경 (시차 0.55) */}
        <div className="absolute inset-0 will-change-transform" style={{ transform: `translateX(${-cam * 0.55}px)` }}>
          <MidLayer stage={stage} width={W * 0.55 + viewW} />
          {stage === "house" && <Lanterns width={W * 0.55 + viewW} />}
        </div>

        <Floor stage={stage} />
        <Motes stage={stage} hope={hope} />

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

        {/* 앞쪽 흐림 (시차 1.25, 심도) */}
        <div className="pointer-events-none absolute inset-0 z-20 will-change-transform" style={{ transform: `translateX(${-cam * 1.25}px)` }}>
          <Foreground stage={stage} width={W * 1.25 + viewW} />
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
          aria-label="전체화면"
          className="absolute right-12 top-3 z-30 rounded-full bg-black/30 p-1.5 text-amber-50"
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : viewRef.current?.requestFullscreen())}
        >
          <Maximize className="size-4" />
        </button>
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
