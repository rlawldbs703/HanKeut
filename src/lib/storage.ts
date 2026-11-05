// 브라우저(localStorage)에 기록을 저장해요. 로그인 없이 쓰는 MVP용이에요.
"use client";

import { normalizeProfile } from "@/lib/tini/profile";
import type { BattleRecord, Scenario, TiniMessage, TiniProfile } from "@/types";

const KEYS = {
  records: "hankeut:records",
  scenarios: "hankeut:ai-scenarios",
  tini: "hankeut:tini-profile",
  tiniChat: "hankeut:tini-chat",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const loadRecords = () => read<BattleRecord[]>(KEYS.records, []);
export function saveRecord(record: BattleRecord) {
  const records = loadRecords().filter((r) => r.id !== record.id);
  write(KEYS.records, [...records, record].slice(-100));
}
export const clearRecords = () => window.localStorage.removeItem(KEYS.records);

export function saveAiScenario(scenario: Scenario) {
  const all = read<Record<string, Scenario>>(KEYS.scenarios, {});
  write(KEYS.scenarios, { ...all, [scenario.id]: scenario });
}
export const loadAiScenario = (id: string) => read<Record<string, Scenario>>(KEYS.scenarios, {})[id];

// 예전 형식으로 저장된 값도 normalizeProfile이 새 형식으로 바꿔 줘요.
export const loadTiniProfile = (): TiniProfile | null => normalizeProfile(read<unknown>(KEYS.tini, null));
export const saveTiniProfile = (p: TiniProfile) => write(KEYS.tini, p);
export const loadTiniChat = () => read<TiniMessage[]>(KEYS.tiniChat, []);
export const saveTiniChat = (m: TiniMessage[]) => write(KEYS.tiniChat, m.slice(-50));
