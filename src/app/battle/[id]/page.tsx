import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { BattleRoom } from "@/components/battle/battle-room";

export default function BattleRoomPage({ params }: PageProps<"/battle/[id]">) {
  // 주소의 id는 요청할 때 정해지므로 Suspense로 감싸 로딩 표시를 먼저 보여 줘요.
  return (
    <Suspense fallback={<Loader2 className="mx-auto mt-10 animate-spin" />}>
      <BattleRoomLoader params={params} />
    </Suspense>
  );
}

async function BattleRoomLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BattleRoom scenarioId={decodeURIComponent(id)} />;
}
