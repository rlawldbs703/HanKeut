import { describe, expect, it } from "vitest";
import { ACCESSORIES, BODY_SHAPES, bodyTop } from "./catalog";
import {
  DEFAULT_AVATAR,
  moodForDelta,
  normalizeProfile,
  poseForMood,
  setAccessoryColor,
  toggleAccessory,
} from "./profile";

describe("카탈로그", () => {
  it("장신구 5종: 리본·왕관·헤드셋·안경·별 머리핀", () => {
    expect(ACCESSORIES.map((a) => a.id)).toEqual(["ribbon", "crown", "headset", "glasses", "starPin"]);
  });

  it("몸 모양마다 팔 2개, 다리 2개, 얼굴 위치가 있다", () => {
    for (const shape of Object.values(BODY_SHAPES)) {
      expect(shape.arms).toHaveLength(2);
      expect(shape.legs).toHaveLength(2);
      expect(shape.circles.length).toBeGreaterThan(3);
    }
    expect(bodyTop("cloud")).toBeLessThan(BODY_SHAPES.cloud.face.y);
  });
});

describe("normalizeProfile", () => {
  it("빈 값은 null", () => {
    expect(normalizeProfile(null)).toBeNull();
    expect(normalizeProfile("x")).toBeNull();
  });

  it("예전 형식(emoji, color)을 새 아바타로 바꾼다", () => {
    const p = normalizeProfile({ name: "콩이", emoji: "🐣", color: "#bfdbfe", personality: "realistic", speechStyle: "polite" });
    expect(p).toMatchObject({ name: "콩이", personality: "realistic", speechStyle: "polite" });
    expect(p?.avatar.body).toBe("cloud");
    expect(p?.avatar.bodyColor).toBe("#bfdbfe");
    expect(p?.avatar.accessoryColors.crown).toBeDefined();
  });

  it("잘못된 아이템·색은 버리고 중복을 없앤다", () => {
    const p = normalizeProfile({
      name: "  ",
      avatar: { body: "dragon", bodyColor: "red", accessories: ["crown", "crown", "sword"], accessoryColors: { crown: "#123456", ribbon: "x" } },
    });
    expect(p?.name).toBe("티니");
    expect(p?.avatar.body).toBe("cloud");
    expect(p?.avatar.bodyColor).toBe(DEFAULT_AVATAR.bodyColor);
    expect(p?.avatar.accessories).toEqual(["crown"]);
    expect(p?.avatar.accessoryColors.crown).toBe("#123456");
    expect(p?.avatar.accessoryColors.ribbon).toBe(DEFAULT_AVATAR.accessoryColors.ribbon);
  });
});

describe("장신구 편집", () => {
  it("켜고 끄며 원래 값은 그대로 둔다", () => {
    const on = toggleAccessory(DEFAULT_AVATAR, "glasses");
    expect(on.accessories).toContain("glasses");
    expect(DEFAULT_AVATAR.accessories).not.toContain("glasses");
    expect(toggleAccessory(on, "glasses").accessories).not.toContain("glasses");
  });

  it("장신구마다 색을 따로 바꾼다", () => {
    const a = setAccessoryColor(DEFAULT_AVATAR, "crown", "#8AB4F8");
    expect(a.accessoryColors.crown).toBe("#8AB4F8");
    expect(a.accessoryColors.ribbon).toBe(DEFAULT_AVATAR.accessoryColors.ribbon);
  });
});

describe("상황별 표정·움직임", () => {
  it("기분에 맞는 표정과 움직임을 고른다", () => {
    expect(poseForMood("idle")).toEqual({ expression: "smile", motion: "float" });
    expect(poseForMood("happy")).toEqual({ expression: "happy", motion: "bounce" });
    expect(poseForMood("sad")).toEqual({ expression: "sad", motion: "droop" });
    expect(poseForMood("thinking").motion).toBe("wiggle");
  });

  it("게이지 변화량으로 대결 중 반응을 정한다", () => {
    expect(moodForDelta(12)).toBe("happy");
    expect(moodForDelta(-10)).toBe("sad");
    expect(moodForDelta(-3)).toBe("surprised");
    expect(moodForDelta(undefined)).toBe("cheer");
  });
});
