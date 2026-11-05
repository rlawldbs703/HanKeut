import { Progress } from "@/components/ui/progress";

/** 상대의 마음 게이지. 목표 지점에 선을 그어 보여 줘요. */
export function GaugeBar({ value, goal }: { value: number; goal: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span>마음 게이지</span>
        <span className="tabular-nums">
          <b className="text-base text-primary">{value}</b> / 목표 {goal}
        </span>
      </div>
      <div className="relative">
        <Progress
          value={value}
          aria-label="마음 게이지"
          className="[&_[data-slot=progress-indicator]]:duration-500 [&_[data-slot=progress-track]]:h-3"
        />
        <div
          className="absolute -top-[3px] h-[18px] w-0.5 rounded bg-foreground/70"
          style={{ left: `${goal}%` }}
          title={`목표 ${goal}`}
        />
      </div>
    </div>
  );
}
