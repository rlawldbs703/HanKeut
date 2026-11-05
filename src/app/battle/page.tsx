import { ScenarioPicker } from "@/components/battle/scenario-picker";

export default function BattlePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black">한끗차이 ⚔️</h1>
        <p className="text-sm text-muted-foreground">
          연습하고 싶은 상황을 고르세요. 상대의 마음 게이지를 목표까지 올리면 승리!
        </p>
      </div>
      <ScenarioPicker />
    </div>
  );
}
