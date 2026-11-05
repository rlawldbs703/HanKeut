"use client";

import { Loader2 } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { loadCreation } from "@/lib/storage";
import { StarsGame } from "./stars-game";

/** 공동창작 결과(있으면)를 불러와 게임에 넘겨요. */
export function PlayLoader() {
  const hydrated = useHydrated();
  if (!hydrated) return <Loader2 className="mx-auto mt-10 animate-spin" />;
  return <StarsGame coCreated={loadCreation() ?? undefined} />;
}
