// MINI-TTINI 먼지 캐릭터 (SVG 레이어 방식)
// 그리는 순서: 먼지 가루 → 다리 → 팔 → 몸(테두리 → 색) → 털 → 얼굴 → 안경 → 헤드셋 → 머리 장식
import { type ReactNode, useId } from "react";
import {
  BODY_SHAPES,
  bodyTop,
  type TiniAccessory,
  type TiniExpression,
  type TiniMotion,
} from "@/lib/tini/catalog";
import { cn } from "@/lib/utils";
import type { TiniAvatar } from "@/types";

const LINE = "#5C4433"; // 테두리 갈색 (로고와 같은 색)
const OUTLINE = 4;

interface Props {
  avatar: TiniAvatar;
  expression?: TiniExpression;
  motion?: TiniMotion;
  className?: string;
  title?: string;
}

export function TiniCharacter({ avatar, expression = "smile", motion = "float", className, title }: Props) {
  const shape = BODY_SHAPES[avatar.body];
  const top = bodyTop(avatar.body);
  const { x: fx, y: fy } = shape.face;
  const has = (id: TiniAccessory) => avatar.accessories.includes(id);
  const color = (id: TiniAccessory) => avatar.accessoryColors[id];
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={title ?? "MINI-TTINI 캐릭터"}
      data-expression={expression}
      data-motion={motion}
      data-accessories={avatar.accessories.join(",")}
      className={cn("overflow-visible", className)}
    >
      {/* 둥실둥실 떠다니는 먼지 가루 */}
      <g fill={avatar.bodyColor} stroke={LINE} strokeWidth={1.5} opacity={0.8}>
        <circle cx={28} cy={60} r={4} />
        <circle cx={176} cy={74} r={3} />
        <circle cx={168} cy={160} r={2.5} />
      </g>

      <g className={cn("tini-motion", motion !== "none" && `tini-${motion}`)}>
        {/* 다리: 짧고 동그랗게 */}
        {shape.legs.map((l, i) => (
          <ellipse key={`leg${i}`} cx={l.x} cy={l.y} rx={9} ry={8} fill={avatar.bodyColor} stroke={LINE} strokeWidth={OUTLINE} />
        ))}
        {/* 팔: 짧은 콩 모양 */}
        {shape.arms.map((a, i) => (
          <ellipse
            key={`arm${i}`}
            cx={a.x}
            cy={a.y}
            rx={11}
            ry={7}
            transform={`rotate(${a.rotate} ${a.x} ${a.y})`}
            fill={avatar.bodyColor}
            stroke={LINE}
            strokeWidth={OUTLINE}
          />
        ))}

        {/* 몸: 테두리용 원을 먼저 크게 그리고, 위에 색 원을 덮어 하나의 실루엣으로 */}
        <g fill={LINE}>
          {shape.circles.map(([cx, cy, r], i) => (
            <circle key={`o${i}`} cx={cx} cy={cy} r={r + OUTLINE / 2 + 1} />
          ))}
        </g>
        <g fill={avatar.bodyColor}>
          {shape.circles.map(([cx, cy, r], i) => (
            <circle key={`f${i}`} cx={cx} cy={cy} r={r - OUTLINE / 2 + 1} />
          ))}
        </g>
        {/* 몽글몽글 하이라이트 */}
        <ellipse cx={fx - 22} cy={top + 22} rx={14} ry={8} fill="#fff" opacity={0.55} transform={`rotate(-20 ${fx - 22} ${top + 22})`} />

        {/* 삐죽 먼지 털 */}
        <g fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round">
          <path d={`M${fx - 4} ${top + 2} q -3 -10 -10 -12`} />
          <path d={`M${fx + 4} ${top + 2} q 2 -12 9 -14`} />
        </g>

        <Face x={fx} y={fy} expression={expression} uid={uid} />

        {has("glasses") && <Glasses x={fx} y={fy} color={color("glasses")} />}
        {has("headset") && <Headset x={fx} y={fy} top={top} color={color("headset")} />}
        {has("crown") && <Crown x={fx} top={top} color={color("crown")} />}
        {has("ribbon") && <Ribbon x={fx - 30} y={top + 12} color={color("ribbon")} />}
        {has("starPin") && <StarPin x={fx + 32} y={top + 14} color={color("starPin")} />}
      </g>
    </svg>
  );
}

/* ---------------- 얼굴 ---------------- */

function Face({ x, y, expression, uid }: { x: number; y: number; expression: TiniExpression; uid: string }) {
  const ex = 17; // 눈 사이 간격의 절반
  const eye = (dx: number, dy = 0, rx = 4.5, ry = 6) => (
    <g key={dx}>
      <ellipse cx={x + dx} cy={y + dy} rx={rx} ry={ry} fill={LINE} />
      <circle cx={x + dx + 1.5} cy={y + dy - 2} r={1.6} fill="#fff" />
    </g>
  );

  let eyes: ReactNode;
  let mouth: ReactNode;
  let extra: ReactNode = null;

  switch (expression) {
    case "happy":
      eyes = (
        <g fill="none" stroke={LINE} strokeWidth={3.5} strokeLinecap="round">
          <path d={`M${x - ex - 6} ${y + 2} q 6 -9 12 0`} />
          <path d={`M${x + ex - 6} ${y + 2} q 6 -9 12 0`} />
        </g>
      );
      mouth = (
        <g>
          <path d={`M${x - 8} ${y + 10} q 8 12 16 0 z`} fill={LINE} />
          <path d={`M${x - 4} ${y + 15} q 4 3 8 0`} fill="#F28B82" />
        </g>
      );
      break;
    case "sad":
      eyes = (
        <g>
          {eye(-ex, 2, 4, 5)}
          {eye(ex, 2, 4, 5)}
          <g stroke={LINE} strokeWidth={2.5} strokeLinecap="round">
            <path d={`M${x - ex - 6} ${y - 8} l 10 -3`} />
            <path d={`M${x + ex + 6} ${y - 8} l -10 -3`} />
          </g>
        </g>
      );
      mouth = <path d={`M${x - 6} ${y + 16} q 6 -6 12 0`} fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" />;
      extra = <path d={`M${x + ex + 2} ${y + 8} q 4 7 0 9 q -4 -2 0 -9 z`} fill="#8AB4F8" stroke={LINE} strokeWidth={1.2} />;
      break;
    case "surprised":
      eyes = (
        <g>
          {eye(-ex, -1, 5.5, 7)}
          {eye(ex, -1, 5.5, 7)}
        </g>
      );
      mouth = <ellipse cx={x} cy={y + 14} rx={4.5} ry={5.5} fill={LINE} />;
      break;
    case "thinking":
      eyes = (
        <g>
          {eye(-ex, -1)}
          {eye(ex, -1)}
          <path d={`M${x + ex - 6} ${y - 11} l 10 -2`} stroke={LINE} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      );
      mouth = <path d={`M${x - 5} ${y + 13} h 10`} stroke={LINE} strokeWidth={3} strokeLinecap="round" />;
      extra = (
        <g fill={LINE}>
          <circle cx={x + 44} cy={y - 30} r={2.5} />
          <circle cx={x + 52} cy={y - 38} r={3} />
          <circle cx={x + 61} cy={y - 47} r={3.5} />
        </g>
      );
      break;
    default:
      // 기본 얼굴: 동글 눈 + ω 입 (눈 깜빡임)
      eyes = (
        <g className="tini-eyes">
          {eye(-ex)}
          {eye(ex)}
        </g>
      );
      mouth = (
        <path
          d={`M${x - 7} ${y + 10} q 3.5 5 7 0 q 3.5 5 7 0`}
          fill="none"
          stroke={LINE}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
  }

  return (
    <g data-part="face" id={`face-${uid}`}>
      {/* 볼터치 */}
      <ellipse cx={x - 28} cy={y + 10} rx={7} ry={4.5} fill="#F7A8C4" opacity={0.7} />
      <ellipse cx={x + 28} cy={y + 10} rx={7} ry={4.5} fill="#F7A8C4" opacity={0.7} />
      {eyes}
      {mouth}
      {extra}
    </g>
  );
}

/* ---------------- 장신구 5종 ---------------- */

function Glasses({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g data-part="glasses" fill="#fff" fillOpacity={0.25} stroke={color} strokeWidth={3.5}>
      <circle cx={x - 17} cy={y} r={11} />
      <circle cx={x + 17} cy={y} r={11} />
      <path d={`M${x - 6} ${y - 1} q 6 -5 12 0`} fill="none" />
    </g>
  );
}

function Headset({ x, y, top, color }: { x: number; y: number; top: number; color: string }) {
  return (
    <g data-part="headset" stroke={LINE} strokeWidth={3}>
      <path d={`M${x - 50} ${y - 2} Q ${x - 50} ${top - 14} ${x} ${top - 14} Q ${x + 50} ${top - 14} ${x + 50} ${y - 2}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
      <path d={`M${x - 50} ${y - 2} Q ${x - 50} ${top - 14} ${x} ${top - 14} Q ${x + 50} ${top - 14} ${x + 50} ${y - 2}`} fill="none" strokeWidth={1.5} />
      <rect x={x - 60} y={y - 14} width={18} height={28} rx={8} fill={color} />
      <rect x={x + 42} y={y - 14} width={18} height={28} rx={8} fill={color} />
      <path d={`M${x + 50} ${y + 12} q 0 18 -30 18`} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      <circle cx={x + 18} cy={y + 30} r={4.5} fill={color} />
    </g>
  );
}

function Crown({ x, top, color }: { x: number; top: number; color: string }) {
  const b = top + 6; // 왕관 아랫선
  return (
    <g data-part="crown" stroke={LINE} strokeWidth={3} strokeLinejoin="round">
      <path d={`M${x - 20} ${b} L ${x - 23} ${b - 22} L ${x - 10} ${b - 12} L ${x} ${b - 28} L ${x + 10} ${b - 12} L ${x + 23} ${b - 22} L ${x + 20} ${b} Z`} fill={color} />
      <circle cx={x} cy={b - 7} r={3} fill="#fff" />
      <circle cx={x - 12} cy={b - 5} r={2} fill="#fff" />
      <circle cx={x + 12} cy={b - 5} r={2} fill="#fff" />
    </g>
  );
}

function Ribbon({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g data-part="ribbon" fill={color} stroke={LINE} strokeWidth={3} strokeLinejoin="round" transform={`rotate(-18 ${x} ${y})`}>
      <path d={`M${x} ${y} L ${x - 20} ${y - 12} Q ${x - 25} ${y} ${x - 20} ${y + 12} Z`} />
      <path d={`M${x} ${y} L ${x + 20} ${y - 12} Q ${x + 25} ${y} ${x + 20} ${y + 12} Z`} />
      <circle cx={x} cy={y} r={5.5} />
    </g>
  );
}

function StarPin({ x, y, color }: { x: number; y: number; color: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 13 : 5.5;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  return (
    <g data-part="starPin">
      <polygon points={pts} fill={color} stroke={LINE} strokeWidth={3} strokeLinejoin="round" transform={`rotate(12 ${x} ${y})`} />
    </g>
  );
}
