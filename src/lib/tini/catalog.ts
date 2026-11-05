// MINI-TTINI 먼지 캐릭터의 부품 목록이에요. 아이템을 늘리고 싶으면 여기에 추가하면 돼요.

export type TiniBodyShape = "cloud" | "cotton" | "blob";
export type TiniAccessory = "ribbon" | "crown" | "headset" | "glasses" | "starPin";
export type TiniExpression = "smile" | "happy" | "sad" | "surprised" | "thinking";
export type TiniMotion = "float" | "bounce" | "droop" | "wiggle" | "none";

type Circle = [cx: number, cy: number, r: number];

export interface BodyGeometry {
  label: string;
  desc: string;
  circles: Circle[];
  face: { x: number; y: number };
  arms: { x: number; y: number; rotate: number }[];
  legs: { x: number; y: number }[];
}

/** 몸 모양 3종 (200×200 좌표). 여러 원을 겹쳐 몽글몽글한 실루엣을 만들어요. */
export const BODY_SHAPES: Record<TiniBodyShape, BodyGeometry> = {
  cloud: {
    label: "구름",
    desc: "폭신한 구름 먼지",
    circles: [
      [100, 112, 46],
      [64, 122, 28],
      [136, 122, 28],
      [80, 86, 25],
      [118, 84, 27],
      [100, 136, 36],
    ],
    face: { x: 100, y: 112 },
    arms: [
      { x: 42, y: 128, rotate: -30 },
      { x: 158, y: 128, rotate: 30 },
    ],
    legs: [
      { x: 84, y: 170 },
      { x: 116, y: 170 },
    ],
  },
  cotton: {
    label: "솜뭉치",
    desc: "보송보송 솜뭉치 먼지",
    circles: [
      [100, 114, 44],
      ...Array.from({ length: 11 }, (_, i): Circle => {
        const a = (i / 11) * Math.PI * 2 - Math.PI / 2;
        return [
          Math.round((100 + Math.cos(a) * 44) * 10) / 10,
          Math.round((114 + Math.sin(a) * 40) * 10) / 10,
          15,
        ];
      }),
    ],
    face: { x: 100, y: 114 },
    arms: [
      { x: 44, y: 130, rotate: -25 },
      { x: 156, y: 130, rotate: 25 },
    ],
    legs: [
      { x: 86, y: 168 },
      { x: 114, y: 168 },
    ],
  },
  blob: {
    label: "몽글",
    desc: "삐뚤빼뚤 몽글 먼지",
    circles: [
      [98, 112, 45],
      [134, 102, 27],
      [64, 126, 27],
      [118, 138, 30],
      [78, 82, 22],
      [112, 78, 16],
    ],
    face: { x: 98, y: 112 },
    arms: [
      { x: 40, y: 132, rotate: -35 },
      { x: 160, y: 112, rotate: 20 },
    ],
    legs: [
      { x: 82, y: 166 },
      { x: 120, y: 170 },
    ],
  },
};

export const BODY_COLORS = [
  { value: "#FFF4D6", label: "크림" },
  { value: "#FBD3DC", label: "딸기우유" },
  { value: "#CFE6F7", label: "하늘" },
  { value: "#CDEFD9", label: "민트" },
  { value: "#E2D6F5", label: "라벤더" },
  { value: "#FFF0A8", label: "레몬" },
  { value: "#FFD8BF", label: "복숭아" },
  { value: "#E4E1DC", label: "회색먼지" },
] as const;

export const ACCESSORY_COLORS = [
  { value: "#F0D98C", label: "노랑" },
  { value: "#F28B82", label: "빨강" },
  { value: "#F7A8C4", label: "분홍" },
  { value: "#8AB4F8", label: "파랑" },
  { value: "#81C995", label: "초록" },
  { value: "#C3A6F0", label: "보라" },
  { value: "#8D6E57", label: "갈색" },
  { value: "#4A3B32", label: "검정" },
] as const;

export const ACCESSORIES: { id: TiniAccessory; label: string; icon: string; defaultColor: string }[] = [
  { id: "ribbon", label: "리본", icon: "🎀", defaultColor: "#F28B82" },
  { id: "crown", label: "왕관", icon: "👑", defaultColor: "#F0D98C" },
  { id: "headset", label: "헤드셋", icon: "🎧", defaultColor: "#4A3B32" },
  { id: "glasses", label: "안경", icon: "👓", defaultColor: "#8D6E57" },
  { id: "starPin", label: "별 머리핀", icon: "⭐", defaultColor: "#F0D98C" },
];

export const EXPRESSIONS: { id: TiniExpression; label: string }[] = [
  { id: "smile", label: "기본" },
  { id: "happy", label: "기쁨" },
  { id: "sad", label: "시무룩" },
  { id: "surprised", label: "놀람" },
  { id: "thinking", label: "생각 중" },
];

export const MOTIONS: { id: TiniMotion; label: string }[] = [
  { id: "float", label: "둥실둥실" },
  { id: "bounce", label: "통통 뛰기" },
  { id: "droop", label: "시무룩해지기" },
  { id: "wiggle", label: "몸 흔들기" },
];

/** 몸의 가장 윗부분 y좌표 (머리 장식 위치 계산용) */
export function bodyTop(shape: TiniBodyShape): number {
  return Math.min(...BODY_SHAPES[shape].circles.map(([, cy, r]) => cy - r));
}
