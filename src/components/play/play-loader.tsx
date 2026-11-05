"use client";

import { Loader2 } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { JourneyGame } from "./journey-game";
import { CapsuleList } from "./time-capsule";

export function PlayLoader() {
  const hydrated = useHydrated();
  if (!hydrated) return <Loader2 className="mx-auto mt-10 animate-spin" />;
  return (
    <div className="space-y-4">
      <JourneyGame />
      <CapsuleList />
    </div>
  );
}
