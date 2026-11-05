"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { type LightPuzzle as Puzzle, createGardenPuzzle, rotateMirror, traceLight } from "@/lib/play/light";
import { RADIO_MAX, RADIO_MIN, RADIO_TARGET, clarity, garble, isTuned } from "@/lib/play/radio";
import { RADIO_RESTORED } from "@/lib/play/story";
import { cn } from "@/lib/utils";
import { playResolve, setRadioNoise } from "./audio";

function Overlay({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-indigo-950/70 p-3 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-3 rounded-2xl bg-indigo-950/90 p-4 text-indigo-50 ring-1 ring-amber-200/40">
        <p className="text-center font-bold text-amber-100">{title}</p>
        {children}
      </div>
    </div>
  );
}

/** 라디오 주파수 퍼즐: 맞춘 상태를 1.2초 유지하면 기억 복원 */
export function RadioPuzzle({ onSolved }: { onSolved: () => void }) {
  const [freq, setFreq] = useState(91.5);
  const c = clarity(freq);
  const tuned = isTuned(freq);

  useEffect(() => {
    setRadioNoise(1 - c);
  }, [c]);
  useEffect(() => () => setRadioNoise(0), []);
  useEffect(() => {
    if (!tuned) return;
    const t = setTimeout(() => {
      playResolve();
      onSolved();
    }, 1200);
    return () => clearTimeout(t);
  }, [tuned, onSolved]);

  return (
    <Overlay title="📻 라디오 주파수 맞추기">
      <p className="text-center text-xs text-indigo-200">잡음이 줄어드는 쪽으로 다이얼을 돌려 과거의 목소리를 찾아요.</p>
      <p className="min-h-12 rounded-lg bg-black/30 p-3 text-center font-medium tracking-wide" aria-live="polite">
        {garble(RADIO_RESTORED[0].text, c)}
      </p>
      <input
        type="range"
        aria-label="라디오 주파수"
        min={RADIO_MIN}
        max={RADIO_MAX}
        step={0.1}
        value={freq}
        onChange={(e) => setFreq(Number(e.target.value))}
        className="w-full accent-amber-300"
      />
      <div className="flex justify-between text-xs tabular-nums">
        <span>{freq.toFixed(1)} MHz</span>
        <span>{tuned ? "✦ 목소리가 들려요…" : `선명도 ${Math.round(c * 100)}%`}</span>
      </div>
      <div className="flex justify-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setFreq((f) => Math.max(RADIO_MIN, +(f - 0.1).toFixed(1)))}>
          −0.1
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setFreq((f) => Math.min(RADIO_MAX, +(f + 0.1).toFixed(1)))}>
          +0.1
        </Button>
      </div>
      <p className="sr-only">목표 주파수 {RADIO_TARGET}</p>
    </Overlay>
  );
}

/** 빛의 경로 퍼즐: 거울을 눌러 방향을 바꾸고 빛을 수정까지 연결 */
export function LightPuzzle({ onSolved }: { onSolved: () => void }) {
  const [p, setP] = useState<Puzzle>(() => createGardenPuzzle());
  const { path, reached } = traceLight(p);
  const lit = new Set(path.map(([r, c]) => `${r},${c}`));
  // 부모가 자주 다시 그려져도 완료 타이머가 초기화되지 않도록 최신 콜백을 ref로 보관
  const solvedRef = useRef(onSolved);
  useEffect(() => {
    solvedRef.current = onSolved;
  });

  useEffect(() => {
    if (!reached) return;
    playResolve();
    const t = setTimeout(() => solvedRef.current(), 1200);
    return () => clearTimeout(t);
  }, [reached]);

  return (
    <Overlay title="✦ 빛의 경로 잇기">
      <p className="text-center text-xs text-indigo-200">거울을 눌러 돌리면 빛이 꺾여요. 빛을 수정까지 이어 주세요.</p>
      <div className="mx-auto grid w-fit grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-1">
        {p.grid.map((row, r) => (
          <div key={r} className="contents">
            <div className="flex w-6 items-center justify-center text-amber-200">{r === p.source.row ? "☀" : ""}</div>
            {row.map((cell, c) => {
              const canRotate = p.rotatable.some(([rr, cc]) => rr === r && cc === c);
              const on = lit.has(`${r},${c}`);
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!canRotate || reached}
                  aria-label={canRotate ? `거울 ${r + 1}행 ${c + 1}열 돌리기` : undefined}
                  onClick={() => setP((prev) => rotateMirror(prev, r, c))}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-md text-xl font-black transition sm:size-12",
                    on ? "bg-amber-200/40 shadow-[0_0_14px_rgba(253,230,138,0.8)]" : "bg-white/5",
                    canRotate && "ring-1 ring-amber-200/70 hover:bg-white/15",
                    cell === "#" && "bg-slate-800/80"
                  )}
                >
                  {cell === "/" && <span className="text-sky-100">╱</span>}
                  {cell === "\\" && <span className="text-sky-100">╲</span>}
                  {cell === "T" && <span className={cn(reached ? "text-amber-200" : "text-violet-300")}>◆</span>}
                  {cell === "#" && <span className="text-slate-500">▪</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-center text-sm">{reached ? "✦ 빛이 수정에 닿았어요!" : "◆ = 수정, ╱╲ = 거울"}</p>
    </Overlay>
  );
}
