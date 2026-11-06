// 교내 GPU(틸론)에서 생성한 《별의 끝에서》 배경 이미지 목록 (생성 과정: tilon-ai/README.md)
// 이미지 파일을 public/generated/에 넣고 아래에 등록하면 게임·홈 화면에 자동 반영돼요. 비어 있으면 기존 SVG 배경만 보여요.
export type GeneratedKey = "title" | "house" | "garden" | "plain" | "attic" | "hall";

export const GENERATED_BG: Partial<Record<GeneratedKey, string>> = {};
