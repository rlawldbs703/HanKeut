"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SHADOW_EXIT, SHADOW_H, SHADOW_START, SHADOW_W, checkOrder, moveInShadow, shadowAt } from "@/lib/journey/minigames";
import { cn } from "@/lib/utils";
import { playChime, playResolve, playShadow } from "./audio";

export function Overlay({ title, story, children }: { title: string; story: string; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-indigo-950/70 p-3 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-3 rounded-2xl bg-indigo-950/90 p-4 text-indigo-50 ring-1 ring-amber-200/40">
        <p className="text-center font-bold text-amber-100">{title}</p>
        <p className="text-center text-xs text-indigo-200">{story}</p>
        {children}
      </div>
    </div>
  );
}

/** 그림자 평원: 그림자를 피해 출구까지 (WASD 한 칸씩, 그림자도 함께 움직임) */
export function ShadowField({ onSolved }: { onSolved: () => void }) {
  const [pos, setPos] = useState(SHADOW_START);
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState("그림자는 내가 움직일 때만 움직여. 패턴을 읽어 봐.");
  const [done, setDone] = useState(false);
  const shadows = shadowAt(step);

  function move(dx: number, dy: number) {
    if (done) return;
    const m = moveInShadow(pos, step, dx, dy);
    setPos(m.pos);
    setStep(m.step);
    if (m.hit) {
      playShadow();
      setMsg("…차가워. 그림자에 삼켜져 처음으로 돌아왔어.");
    } else if (m.done) {
      setDone(true);
      playResolve();
      setMsg("그림자 사이로 빛이 남은 길을 찾았어.");
      setTimeout(onSolved, 1200);
    } else setMsg("");
  }

  useEffect(() => {
    const keys: Record<string, [number, number]> = { w: [0, -1], W: [0, -1], ArrowUp: [0, -1], s: [0, 1], S: [0, 1], ArrowDown: [0, 1], a: [-1, 0], A: [-1, 0], ArrowLeft: [-1, 0], d: [1, 0], D: [1, 0], ArrowRight: [1, 0], " ": [0, 0] };
    const h = (e: KeyboardEvent) => {
      const k = keys[e.key];
      if (!k) return;
      e.preventDefault();
      e.stopPropagation();
      move(k[0], k[1]);
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  });

  return (
    <div className="space-y-2" data-testid="minigame-shadow">
      <div className="mx-auto grid w-fit gap-1" style={{ gridTemplateColumns: `repeat(${SHADOW_W}, minmax(0, 1fr))` }}>
        {Array.from({ length: SHADOW_H }, (_, y) =>
          Array.from({ length: SHADOW_W }, (_, x) => {
            const me = pos.x === x && pos.y === y;
            const sh = shadows.some(([sx, sy]) => sx === x && sy === y);
            const exit = SHADOW_EXIT.x === x && SHADOW_EXIT.y === y;
            return (
              <div key={`${x},${y}`} className={cn("flex size-10 items-center justify-center rounded-md bg-white/5 text-lg transition-colors sm:size-11", exit && "bg-amber-200/30", sh && "bg-black/80 shadow-[0_0_12px_#000]")}>
                {me ? "✦" : sh ? <span className="text-violet-300">◉</span> : exit ? "◇" : ""}
              </div>
            );
          })
        )}
      </div>
      <p className="min-h-5 text-center text-sm">{msg}</p>
      <div className="flex justify-center gap-1">
        {([["◀", -1, 0], ["▲", 0, -1], ["▼", 0, 1], ["▶", 1, 0], ["기다리기", 0, 0]] as const).map(([l, dx, dy]) => (
          <Button key={l} size="sm" variant="secondary" onClick={() => move(dx, dy)}>{l}</Button>
        ))}
      </div>
      <p className="text-center text-[11px] text-indigo-300">WASD 이동 · SPACE 제자리에서 기다리기</p>
    </div>
  );
}

/** 순서 맞추기 공용 (시간의 다락: 기억 카드 / 별의 전당: 별자리) */
function useOrder(count: number, onSolved: () => void, failMsg: string) {
  const [picked, setPicked] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const correct = Array.from({ length: count }, (_, i) => i);
  function pick(i: number) {
    if (picked.includes(i)) return;
    const next = [...picked, i];
    const r = checkOrder(next, correct);
    if (r === "wrong") {
      playShadow();
      setPicked([]);
      setMsg(failMsg);
    } else {
      playChime();
      setPicked(next);
      setMsg("");
      if (r === "ok") {
        playResolve();
        setTimeout(onSolved, 1400);
      }
    }
  }
  return { picked, msg, pick, solved: picked.length === count };
}

export interface MemoryCard {
  label: string;
  text: string;
}

/** 시간의 다락: 되찾은 기억을 지나온 순서대로 */
export function MemoryOrder({ cards, onSolved }: { cards: MemoryCard[]; onSolved: () => void }) {
  const { picked, msg, pick, solved } = useOrder(cards.length, onSolved, "기억이 엉켰어. 가장 오래된 기억부터 천천히 떠올려 봐.");
  const shuffled = [2, 0, 3, 1].filter((i) => i < cards.length);
  return (
    <div className="space-y-2" data-testid="minigame-memory">
      <div className="grid grid-cols-2 gap-2">
        {shuffled.map((i) => {
          const n = picked.indexOf(i);
          return (
            <button key={i} type="button" onClick={() => pick(i)} aria-label={`기억 카드 ${cards[i].label}`} className={cn("min-h-24 rounded-xl p-3 text-left text-sm ring-1 ring-amber-200/40 transition", n >= 0 ? "bg-amber-200/30" : "bg-white/5 hover:bg-white/10")}>
              <p className="text-xs font-bold text-amber-200">{n >= 0 ? `${n + 1}번째 · ` : ""}{cards[i].label}</p>
              <p className="mt-1 line-clamp-3">{cards[i].text}</p>
            </button>
          );
        })}
      </div>
      <p className="min-h-5 text-center text-sm">{solved ? "시간의 상자가 열렸어. 기억이 한 줄로 이어졌어." : msg}</p>
    </div>
  );
}

const STAR_POS = [
  [50, 8],
  [88, 38],
  [74, 88],
  [26, 88],
  [12, 38],
];

/** 별의 전당: 모은 별 조각을 여행한 순서대로 이어 나의 별자리 완성 */
export function Constellation({ labels, onSolved }: { labels: string[]; onSolved: () => void }) {
  const { picked, msg, pick, solved } = useOrder(labels.length, onSolved, "별빛이 흩어졌어. 여행을 시작한 곳부터 다시 이어 봐.");
  return (
    <div className="space-y-2" data-testid="minigame-constellation">
      <div className="relative mx-auto aspect-square w-64">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
          {picked.slice(1).map((p, k) => {
            const a = STAR_POS[picked[k]], b = STAR_POS[p];
            return <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#fde68a" strokeWidth="1.2" />;
          })}
          {solved && <line x1={STAR_POS[picked.at(-1)!][0]} y1={STAR_POS[picked.at(-1)!][1]} x2={STAR_POS[picked[0]][0]} y2={STAR_POS[picked[0]][1]} stroke="#fde68a" strokeWidth="1.2" />}
        </svg>
        {labels.map((l, i) => (
          <button
            key={i}
            type="button"
            onClick={() => pick(i)}
            aria-label={`별 조각 ${l}`}
            className={cn("absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-[10px]", picked.includes(i) ? "text-amber-100" : "text-indigo-200")}
            style={{ left: `${STAR_POS[i][0]}%`, top: `${STAR_POS[i][1]}%` }}
          >
            <span className={cn("text-2xl", picked.includes(i) && "drop-shadow-[0_0_10px_#fde68a]")}>✦</span>
            {l}
          </button>
        ))}
      </div>
      <p className="min-h-5 text-center text-sm">{solved ? "나의 별자리가 완성됐어." : msg || "지나온 장소의 순서대로 별을 이어 봐."}</p>
    </div>
  );
}
