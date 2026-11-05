// MINI-TTINI 프로필(꾸미기 설정) 관련 순수 함수예요.
import type { TiniAvatar, TiniProfile } from "@/types";
import {
  ACCESSORIES,
  ACCESSORY_COLORS,
  BODY_COLORS,
  BODY_SHAPES,
  type TiniAccessory,
  type TiniBodyShape,
  type TiniExpression,
  type TiniMotion,
} from "./catalog";

export const DEFAULT_ACCESSORY_COLORS = Object.fromEntries(
  ACCESSORIES.map((a) => [a.id, a.defaultColor])
) as Record<TiniAccessory, string>;

export const DEFAULT_AVATAR: TiniAvatar = {
  body: "cloud",
  bodyColor: BODY_COLORS[0].value,
  accessories: ["ribbon"],
  accessoryColors: DEFAULT_ACCESSORY_COLORS,
};

export const DEFAULT_PROFILE: TiniProfile = {
  name: "티니",
  personality: "warm",
  speechStyle: "casual",
  avatar: DEFAULT_AVATAR,
};

const ACCESSORY_IDS = ACCESSORIES.map((a) => a.id);
const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);

/** 저장된 값이 예전 형식(emoji/color)이거나 일부 깨져 있어도 안전한 프로필로 바꿔요. */
export function normalizeProfile(raw: unknown): TiniProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const a = (r.avatar ?? {}) as Record<string, unknown>;

  const body = (Object.keys(BODY_SHAPES) as TiniBodyShape[]).includes(a.body as TiniBodyShape)
    ? (a.body as TiniBodyShape)
    : DEFAULT_AVATAR.body;
  const accessories = Array.isArray(a.accessories)
    ? [...new Set(a.accessories.filter((x): x is TiniAccessory => ACCESSORY_IDS.includes(x as TiniAccessory)))]
    : DEFAULT_AVATAR.accessories;
  const savedColors = (a.accessoryColors ?? {}) as Record<string, unknown>;
  const accessoryColors = Object.fromEntries(
    ACCESSORY_IDS.map((id) => [id, isHex(savedColors[id]) ? savedColors[id] : DEFAULT_ACCESSORY_COLORS[id]])
  ) as Record<TiniAccessory, string>;

  return {
    name: typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, 20) : DEFAULT_PROFILE.name,
    personality: ["warm", "realistic", "cheerful"].includes(r.personality as string)
      ? (r.personality as TiniProfile["personality"])
      : DEFAULT_PROFILE.personality,
    speechStyle: r.speechStyle === "polite" ? "polite" : "casual",
    avatar: {
      body,
      // 예전 형식의 color(배경색)는 몸 색으로 이어서 써요.
      bodyColor: isHex(a.bodyColor) ? a.bodyColor : isHex(r.color) ? r.color : DEFAULT_AVATAR.bodyColor,
      accessories,
      accessoryColors,
    },
  };
}

/** 장신구를 켜고 끄기 (원래 값은 바꾸지 않아요) */
export function toggleAccessory(avatar: TiniAvatar, id: TiniAccessory): TiniAvatar {
  const on = avatar.accessories.includes(id);
  return {
    ...avatar,
    accessories: on ? avatar.accessories.filter((x) => x !== id) : [...avatar.accessories, id],
  };
}

export function setAccessoryColor(avatar: TiniAvatar, id: TiniAccessory, color: string): TiniAvatar {
  return { ...avatar, accessoryColors: { ...avatar.accessoryColors, [id]: color } };
}

export const isPaletteColor = (color: string) =>
  [...BODY_COLORS, ...ACCESSORY_COLORS].some((c) => c.value === color);

/** 상황(기분) → 표정 + 움직임 */
export type TiniMood = "idle" | "thinking" | "happy" | "sad" | "surprised" | "cheer";

export function poseForMood(mood: TiniMood): { expression: TiniExpression; motion: TiniMotion } {
  switch (mood) {
    case "thinking":
      return { expression: "thinking", motion: "wiggle" };
    case "happy":
      return { expression: "happy", motion: "bounce" };
    case "cheer":
      return { expression: "happy", motion: "float" };
    case "sad":
      return { expression: "sad", motion: "droop" };
    case "surprised":
      return { expression: "surprised", motion: "wiggle" };
    default:
      return { expression: "smile", motion: "float" };
  }
}

/** 대결 중 게이지 변화량 → 티니의 반응 */
export function moodForDelta(delta: number | undefined): TiniMood {
  if (delta === undefined) return "cheer";
  if (delta >= 8) return "happy";
  if (delta <= -8) return "sad";
  if (delta < 0) return "surprised";
  return "cheer";
}
