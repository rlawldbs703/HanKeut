"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** 브라우저에서 화면이 준비됐는지 알려 줘요. localStorage는 이 값이 true일 때만 읽어요. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
