// 《별의 끝에서》 배경·캐릭터·오브젝트 그림 (모두 SVG 벡터 → 확대해도 선명)
import type { StageId, WorldObject } from "@/lib/play/story";
import { cn } from "@/lib/utils";

const GOLD = "#fde68a";

/* ================= 하늘 (고정) ================= */

export function Sky({ stage, hope }: { stage: StageId; hope: number }) {
  const house = stage === "house";
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          {house ? (
            <>
              <stop offset="0" stopColor="#0b0a2e" />
              <stop offset=".45" stopColor="#2a1f5f" />
              <stop offset=".8" stopColor="#5b3f8c" />
              <stop offset="1" stopColor="#8a5fa8" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#1a1446" />
              <stop offset=".4" stopColor="#4b3a8a" />
              <stop offset=".75" stopColor="#b77fae" />
              <stop offset="1" stopColor="#f2c48d" />
            </>
          )}
        </linearGradient>
        <radialGradient id="moon" cx=".45" cy=".4" r=".6">
          <stop offset="0" stopColor="#fffbeb" />
          <stop offset=".7" stopColor="#fde9b0" />
          <stop offset="1" stopColor="#f5d08a" />
        </radialGradient>
        <radialGradient id="halo">
          <stop offset="0" stopColor="#fff7d6" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff7d6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="aurora" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0" />
          <stop offset=".3" stopColor="#a78bfa" stopOpacity=".55" />
          <stop offset=".6" stopColor="#f0abfc" stopOpacity=".45" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0" />
        </linearGradient>
        {/* 수채화 번짐: 노이즈로 가장자리를 일그러뜨리고 흐리게 */}
        <filter id="wc" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="3" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="60" />
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="soft">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect width="1600" height="900" fill="url(#sky)" />
      {/* 성운 */}
      <g filter="url(#wc)" opacity={0.45 + hope * 0.3} style={{ mixBlendMode: "screen" }}>
        <ellipse cx="300" cy="220" rx="380" ry="150" fill="#6d28d9" />
        <ellipse cx="1180" cy="170" rx="420" ry="130" fill="#be185d" opacity=".7" />
        <ellipse cx="800" cy="380" rx="520" ry="120" fill="#0e7490" opacity=".5" />
      </g>
      {/* 오로라 */}
      <path d="M-50 260 C 300 180, 600 330, 900 240 S 1400 200, 1700 280" fill="none" stroke="url(#aurora)" strokeWidth="70" filter="url(#soft)" opacity={0.4 + hope * 0.4} />
      {/* 달과 빛줄기 */}
      <g opacity={0.75 + hope * 0.25}>
        <circle cx="1120" cy="200" r="260" fill="url(#halo)" />
        {[-28, -12, 6, 22].map((a) => (
          <polygon key={a} points="1120,200 1060,900 1180,900" fill="url(#ray)" transform={`rotate(${a} 1120 200)`} filter="url(#soft)" opacity=".6" />
        ))}
        <circle cx="1120" cy="200" r="78" fill="url(#moon)" />
        <circle cx="1095" cy="185" r="12" fill="#f3d596" opacity=".5" />
        <circle cx="1140" cy="225" r="8" fill="#f3d596" opacity=".4" />
      </g>
    </svg>
  );
}

/** 반짝이는 별 + 별똥별 */
export function StarField({ hope }: { hope: number }) {
  const count = 30 + Math.round(hope * 40);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const big = i % 9 === 0;
        return (
          <span
            key={i}
            className="anim-twinkle absolute"
            style={{ left: `${(i * 47 + 13) % 100}%`, top: `${(i * 29 + 7) % 58}%`, animationDelay: `${(i % 11) * 0.35}s` }}
          >
            {big ? (
              <svg viewBox="-10 -10 20 20" className="size-4">
                <path d="M0 -9 Q1 -1 9 0 Q1 1 0 9 Q-1 1 -9 0 Q-1 -1 0 -9Z" fill="#fffbeb" style={{ filter: "drop-shadow(0 0 4px #fde68a)" }} />
              </svg>
            ) : (
              <span className="block rounded-full bg-amber-50" style={{ width: 1 + (i % 3), height: 1 + (i % 3), boxShadow: "0 0 6px #fef3c7" }} />
            )}
          </span>
        );
      })}
      <span className="anim-shooting absolute right-[10%] top-[8%] h-px w-28 bg-gradient-to-r from-transparent via-amber-50 to-white" />
    </div>
  );
}

/* ================= 장소별 배경 (시차 레이어) ================= */

/** 중간 레이어: 월드 폭에 맞춰 반복 배치. factor = 시차 비율 */
export function MidLayer({ stage, width }: { stage: StageId; width: number }) {
  const n = Math.ceil(width / 520) + 2;
  return (
    <svg className="absolute bottom-[34%] left-0 h-[62%] overflow-visible" style={{ width }} viewBox={`0 0 ${width} 560`} preserveAspectRatio="xMinYMax meet" aria-hidden>
      <defs>
        <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e1b4b" />
          <stop offset="1" stopColor="#6d4c9f" />
        </linearGradient>
        <radialGradient id="lamp">
          <stop offset="0" stopColor="#fff3c4" stopOpacity=".9" />
          <stop offset=".4" stopColor="#fbbf24" stopOpacity=".35" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b4b8a" />
          <stop offset="1" stopColor="#2e2a5a" />
        </linearGradient>
        <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d5a7a" />
          <stop offset="1" stopColor="#25304f" />
        </linearGradient>
        <filter id="wc2" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="12" />
        </filter>
      </defs>
      {stage === "house"
        ? Array.from({ length: n }, (_, i) => {
            const x = i * 520;
            return (
              <g key={i} transform={`translate(${x} 0)`} filter="url(#wc2)">
                {/* 벽 기둥과 아치 창 */}
                <rect x="0" y="40" width="34" height="520" fill="#2b2160" />
                <path d="M90 560 V 200 A 110 110 0 0 1 310 200 V 560 Z" fill="#3a2d78" />
                <path d="M110 540 V 205 A 90 90 0 0 1 290 205 V 540 Z" fill="url(#win)" />
                <path d="M200 115 V 540 M110 330 H 290" stroke="#c4a86a" strokeWidth="6" opacity=".55" />
                {[150, 240, 175, 262, 132].map((sx, k) => (
                  <circle key={k} cx={sx} cy={180 + k * 37} r={1.6 + (k % 2)} fill="#fffbeb" opacity=".9" />
                ))}
                {/* 책장 */}
                <rect x="360" y="250" width="120" height="310" rx="6" fill="#2a1d52" stroke="#4c3a87" strokeWidth="4" />
                {[300, 370, 440, 510].map((sy) => (
                  <g key={sy}>
                    <rect x="366" y={sy} width="108" height="5" fill="#4c3a87" />
                    {[0, 1, 2, 3, 4].map((b) => (
                      <rect key={b} x={372 + b * 20} y={sy - 40 + (b % 2) * 8} width="14" height={40 - (b % 2) * 8} rx="2" fill={["#6b4f9e", "#8b5e83", "#4f6aa0", "#9a7b4f", "#6a8f8a"][b]} opacity=".8" />
                    ))}
                  </g>
                ))}
                <circle cx="420" cy="276" r="12" fill="#fde68a" opacity=".7" />
              </g>
            );
          })
        : (
          <g filter="url(#wc2)">
            <path d={`M0 380 ${Array.from({ length: n * 2 }, (_, i) => `Q ${i * 260 + 130} ${300 + (i % 3) * 30} ${(i + 1) * 260} 380`).join(" ")} V 560 H 0 Z`} fill="url(#hill1)" />
            <path d={`M0 440 ${Array.from({ length: n * 2 }, (_, i) => `Q ${i * 300 + 150} ${390 + (i % 2) * 40} ${(i + 1) * 300} 440`).join(" ")} V 560 H 0 Z`} fill="url(#hill2)" />
            {Array.from({ length: n }, (_, i) => {
              const x = i * 520 + 60;
              return (
                <g key={i}>
                  {/* 버드나무 */}
                  <path d={`M${x + 330} 560 C ${x + 320} 420, ${x + 350} 330, ${x + 340} 250`} stroke="#2a2346" strokeWidth="18" fill="none" />
                  {/* 겹친 잎 덩어리 + 길게 늘어진 가지 */}
                  {[
                    [-55, 268, 48],
                    [0, 240, 58],
                    [55, 265, 46],
                    [-25, 280, 40],
                    [30, 282, 42],
                  ].map(([dx, cy, r], k) => (
                    <circle key={k} cx={x + 340 + dx} cy={cy} r={r} fill={k % 2 ? "#46457e" : "#3b3a6e"} />
                  ))}
                  {Array.from({ length: 11 }, (_, k) => (
                    <path
                      key={k}
                      d={`M${x + 268 + k * 14} ${262 + Math.abs(5 - k) * 3} q ${k % 2 ? 8 : -6} 90 ${k % 2 ? -2 : 4} ${150 + (k % 3) * 25}`}
                      stroke={k % 3 ? "#6c7fb8" : "#8fa3d6"}
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                      opacity=".75"
                    />
                  ))}
                  {/* 덩굴 아치 */}
                  <path d={`M${x} 560 V 330 A 80 80 0 0 1 ${x + 160} 330 V 560`} fill="none" stroke="#8ab0a8" strokeWidth="12" opacity=".5" />
                  {[0, 1, 2, 3, 4, 5, 6].map((k) => (
                    <circle key={k} cx={x + 12 + k * 23} cy={330 - Math.sin((k / 6) * Math.PI) * 76} r="7" fill="#f9a8d4" opacity=".75" />
                  ))}
                </g>
              );
            })}
          </g>
        )}
      {/* 빛 웅덩이 / 빛나는 꽃 (필터 없이 선명하게) */}
      {Array.from({ length: n }, (_, i) =>
        stage === "house" ? (
          <ellipse key={i} cx={i * 520 + 200} cy="560" rx="160" ry="40" fill="url(#lamp)" opacity=".5" />
        ) : (
          <g key={i}>
            {[0, 1, 2, 3].map((k) => (
              <g key={k} transform={`translate(${i * 520 + 40 + k * 110} ${520 - (k % 2) * 18})`}>
                <circle r="14" fill="#f0abfc" opacity=".25" />
                <circle r="5" fill="#fdf4ff" style={{ filter: "drop-shadow(0 0 6px #f0abfc)" }} />
              </g>
            ))}
          </g>
        )
      )}
    </svg>
  );
}

/** 별 등불 (별의 집 천장에서 흔들림) */
export function Lanterns({ width }: { width: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0" style={{ width }} aria-hidden>
      {Array.from({ length: Math.ceil(width / 380) }, (_, i) => (
        <div key={i} className="anim-sway absolute top-0" style={{ left: i * 380 + 180, animationDelay: `${i * 0.7}s` }}>
          <div className="mx-auto h-16 w-px bg-amber-100/40" style={{ height: 50 + (i % 3) * 30 }} />
          <svg viewBox="-20 -20 40 40" className="-mt-1 size-10" style={{ filter: "drop-shadow(0 0 14px #fbbf24)" }}>
            <path d="M0 -16 L4 -5 L16 -5 L6 2 L10 14 L0 7 L-10 14 L-6 2 L-16 -5 L-4 -5Z" fill={GOLD} stroke="#b45309" strokeWidth="1.5" />
          </svg>
        </div>
      ))}
    </div>
  );
}

/** 바닥: 원근감 있는 그라데이션 + 반사광 */
export function Floor({ stage }: { stage: StageId }) {
  const house = stage === "house";
  return (
    <div className="absolute inset-x-0 bottom-0 h-[38%] overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: house
            ? "linear-gradient(180deg,#5a4390 0%,#3a2a6a 45%,#1d1540 100%)"
            : "linear-gradient(180deg,#5d7f8c 0%,#3b5570 45%,#1c2742 100%)",
        }}
      />
      {/* 원근 줄무늬 (마루 / 풀길) */}
      <svg className="absolute inset-0 size-full opacity-30" viewBox="0 0 100 40" preserveAspectRatio="none">
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} x1="0" x2="100" y1={2 + i * i * 0.9} y2={2 + i * i * 0.9} stroke={house ? "#c4a86a" : "#a7f3d0"} strokeWidth=".25" />
        ))}
      </svg>
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/15 to-transparent" />
      {!house && <div className="anim-drift absolute -inset-x-10 top-[10%] h-16 rounded-full bg-white/15 blur-2xl" />}
    </div>
  );
}

/** 앞쪽 흐린 실루엣 (심도 표현) */
export function Foreground({ stage, width }: { stage: StageId; width: number }) {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 h-[30%] blur-[5px]" style={{ width }} aria-hidden>
      {Array.from({ length: Math.ceil(width / 640) + 1 }, (_, i) =>
        stage === "house" ? (
          <div key={i} className="absolute bottom-[-30px] h-36 w-24 rounded-t-3xl bg-[#140e30]/90" style={{ left: i * 640 + 300 }} />
        ) : (
          <svg key={i} viewBox="0 0 200 120" className="absolute bottom-[-10px] h-40 w-64" style={{ left: i * 640 + 120 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((k) => (
              <path key={k} d={`M${30 + k * 22} 120 Q ${20 + k * 24} 50 ${40 + k * 20} ${10 + (k % 3) * 15}`} stroke="#0f1a2e" strokeWidth="9" fill="none" />
            ))}
          </svg>
        )
      )}
    </div>
  );
}

/** 떠다니는 빛 입자 / 반딧불이 */
export function Motes({ stage, hope }: { stage: StageId; hope: number }) {
  const n = 16 + Math.round(hope * 16);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={cn("absolute rounded-full", stage === "garden" && i % 2 ? "anim-firefly bg-lime-200" : "anim-mote bg-amber-100")}
          style={{
            left: `${(i * 61) % 100}%`,
            top: `${35 + ((i * 23) % 55)}%`,
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            animationDelay: `${(i % 9) * 0.8}s`,
            boxShadow: stage === "garden" && i % 2 ? "0 0 10px 2px #d9f99d" : "0 0 8px 2px #fde68a",
          }}
        />
      ))}
    </div>
  );
}

/* ================= 주인공: 별빛 아이 ================= */

export function StarChild({ moving, dissolve }: { moving: boolean; dissolve: boolean }) {
  return (
    <div className={cn("relative transition-all duration-[3000ms]", dissolve && "scale-125 opacity-0 blur-md")}>
      {/* 걸을 때 남는 별가루 */}
      {moving &&
        [0, 1, 2].map((k) => (
          <span key={k} className="anim-mote absolute bottom-6 size-1.5 rounded-full bg-amber-100" style={{ left: -6 - k * 8, animationDuration: "1.2s", animationDelay: `${k * 0.25}s`, boxShadow: "0 0 8px #fde68a" }} />
        ))}
      <svg viewBox="0 0 80 120" className={cn("h-32 w-[86px]", moving ? "anim-walk" : "anim-breathe")} aria-label="별빛 아이">
        <defs>
          <radialGradient id="aura" cx="50%" cy="45%" r="55%">
            <stop offset="0" stopColor="#fffbeb" stopOpacity=".9" />
            <stop offset=".5" stopColor="#fde68a" stopOpacity=".35" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cloak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5f3ff" />
            <stop offset=".55" stopColor="#c4b5fd" />
            <stop offset="1" stopColor="#6d5bd0" />
          </linearGradient>
          <radialGradient id="face" cx=".45" cy=".4">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#fef3c7" />
          </radialGradient>
          <filter id="glowF" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse cx="40" cy="116" rx="18" ry="3.5" fill="#000" opacity=".3" />
        <circle cx="40" cy="58" r="40" fill="url(#aura)" />
        {/* 망토 */}
        <path d="M40 44 C 56 46 62 80 64 108 Q 52 104 40 110 Q 28 104 16 108 C 18 80 24 46 40 44Z" fill="url(#cloak)" stroke="#7c6ad6" strokeWidth="1.2" />
        <path d="M30 70 Q 40 76 50 70" stroke="#ede9fe" strokeWidth="1.2" fill="none" opacity=".8" />
        {/* 가슴의 작은 별빛 (심장) */}
        <circle cx="40" cy="80" r="3.2" fill="#fffbeb" filter="url(#glowF)" className="animate-pulse" />
        {/* 후드와 얼굴 */}
        <path d="M22 40 C 22 18 58 18 58 40 C 58 52 22 52 22 40Z" fill="#ddd6fe" stroke="#7c6ad6" strokeWidth="1.2" />
        <ellipse cx="40" cy="40" rx="13" ry="12" fill="url(#face)" />
        <ellipse cx="35" cy="41" rx="1.8" ry="2.4" fill="#3b2a7a" />
        <ellipse cx="45" cy="41" rx="1.8" ry="2.4" fill="#3b2a7a" />
        <ellipse cx="31" cy="46" rx="2.6" ry="1.4" fill="#f9a8d4" opacity=".6" />
        <ellipse cx="49" cy="46" rx="2.6" ry="1.4" fill="#f9a8d4" opacity=".6" />
        {/* 머리 위 별 + 회전하는 빛살 */}
        <g transform="translate(40 14)">
          <g className="anim-spin-slow" opacity=".5">
            {[0, 45, 90, 135].map((a) => (
              <rect key={a} x="-0.6" y="-14" width="1.2" height="28" fill={GOLD} transform={`rotate(${a})`} />
            ))}
          </g>
          <path d="M0 -10 L3 -3 L10 -3 L4 1.5 L6.5 9 L0 4.5 L-6.5 9 L-4 1.5 L-10 -3 L-3 -3Z" fill={GOLD} stroke="#b45309" strokeWidth=".8" filter="url(#glowF)" />
        </g>
      </svg>
      {dissolve && (
        <div className="absolute inset-0">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className="absolute size-1.5 animate-ping rounded-full bg-amber-100" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= 오브젝트 ================= */

export function ObjectArt({ kind, open }: { kind: WorldObject["kind"]; open: boolean }) {
  switch (kind) {
    case "fragment":
      return (
        <svg viewBox="-40 -40 80 80" className="size-20 animate-[bounce_2.4s_infinite]" aria-label="별 조각">
          <circle r="30" fill={GOLD} opacity=".18" />
          <g className="anim-spin-slow">
            {[0, 30, 60, 90, 120, 150].map((a) => (
              <rect key={a} x="-.7" y="-30" width="1.4" height="60" fill={GOLD} opacity=".5" transform={`rotate(${a})`} />
            ))}
          </g>
          <path d="M0 -18 Q 3 -3 18 0 Q 3 3 0 18 Q -3 3 -18 0 Q -3 -3 0 -18Z" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.2" style={{ filter: "drop-shadow(0 0 8px #fde68a)" }} />
        </svg>
      );
    case "radio":
      return (
        <svg viewBox="0 0 80 64" className="h-16 w-20" aria-label="라디오">
          <defs>
            <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c08457" />
              <stop offset="1" stopColor="#7c4a2a" />
            </linearGradient>
          </defs>
          <ellipse cx="40" cy="61" rx="30" ry="3" fill="#000" opacity=".3" />
          <path d="M22 18 L44 4" stroke="#3f2a1a" strokeWidth="2" strokeLinecap="round" />
          <circle cx="44" cy="4" r="2" fill={GOLD} />
          <rect x="6" y="18" width="68" height="40" rx="10" fill="url(#wood)" stroke="#3f2a1a" strokeWidth="2" />
          <circle cx="27" cy="38" r="12" fill="#3f2a1a" />
          {[0, 1, 2, 3].map((k) => (
            <circle key={k} cx="27" cy="38" r={3 + k * 2.5} fill="none" stroke="#a16207" strokeWidth=".8" />
          ))}
          <rect x="46" y="27" width="22" height="9" rx="2" fill="#fef3c7" stroke="#3f2a1a" />
          <line x1="55" y1="27" x2="55" y2="36" stroke="#dc2626" strokeWidth="1.2" />
          <circle cx="51" cy="46" r="3.5" fill="#fde68a" stroke="#3f2a1a" />
          <circle cx="63" cy="46" r="3.5" fill="#fde68a" stroke="#3f2a1a" />
        </svg>
      );
    case "door":
      return (
        <div className="relative" aria-label="문">
          {open && <div className="absolute -inset-8 rounded-full bg-amber-200/40 blur-2xl" />}
          <svg viewBox="0 0 120 200" className="relative h-48 w-28">
            <defs>
              <linearGradient id="doorLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fffbeb" />
                <stop offset="1" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <path d="M8 200 V 60 A 52 52 0 0 1 112 60 V 200Z" fill="#2a1d52" stroke="#c4a86a" strokeWidth="5" />
            <path d="M20 200 V 64 A 40 40 0 0 1 100 64 V 200Z" fill={open ? "url(#doorLight)" : "#1a1240"} opacity={open ? 0.95 : 1} />
            {!open && <circle cx="86" cy="130" r="4" fill={GOLD} />}
            <path d="M60 22 l3 8 8 1 -6 5 2 8 -7 -4 -7 4 2 -8 -6 -5 8 -1z" fill={GOLD} />
          </svg>
        </div>
      );
    case "memory":
      return (
        <svg viewBox="-30 -40 60 70" className="h-16 w-14 animate-pulse" aria-label="기억">
          <path d="M0 30 Q -2 10 0 -4" stroke="#86efac" strokeWidth="2" fill="none" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-14" rx="6" ry="10" fill="#fbcfe8" opacity=".85" transform={`rotate(${a} 0 -4)`} />
          ))}
          <circle cy="-4" r="4" fill="#fffbeb" style={{ filter: "drop-shadow(0 0 8px #f0abfc)" }} />
        </svg>
      );
    case "altar":
      return (
        <svg viewBox="0 0 80 110" className="h-28 w-20" aria-label="빛의 제단">
          <ellipse cx="40" cy="106" rx="30" ry="4" fill="#000" opacity=".3" />
          <path d="M18 106 L24 60 H56 L62 106Z" fill="#cbd5e1" opacity=".55" stroke="#e2e8f0" />
          <rect x="16" y="54" width="48" height="8" rx="3" fill="#e2e8f0" opacity=".7" />
          <g style={{ filter: `drop-shadow(0 0 ${open ? 18 : 6}px ${open ? "#fde68a" : "#c4b5fd"})` }}>
            <path d="M40 8 L54 30 L40 52 L26 30Z" fill={open ? "#fef3c7" : "#c4b5fd"} stroke="#ede9fe" strokeWidth="1.5" />
            <path d="M40 8 L40 52 M26 30 H54" stroke="#ffffff" strokeWidth=".8" opacity=".7" />
          </g>
        </svg>
      );
    case "shadow":
      return (
        <svg viewBox="0 0 100 130" className="h-32 w-24" aria-label="그림자">
          <defs>
            <filter id="smoke" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="2">
                <animate attributeName="baseFrequency" values="0.04;0.07;0.04" dur="6s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" scale="16" />
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>
          <path d="M50 10 C 80 10 88 60 90 125 Q 70 115 50 125 Q 30 115 10 125 C 12 60 20 10 50 10Z" fill="#0b0618" opacity=".85" filter="url(#smoke)" />
          <ellipse cx="38" cy="48" rx="3" ry="4" fill="#c4b5fd" opacity=".8" />
          <ellipse cx="62" cy="48" rx="3" ry="4" fill="#c4b5fd" opacity=".8" />
        </svg>
      );
  }
}
