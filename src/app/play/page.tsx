import { PlayLoader } from "@/components/play/play-loader";

export default function PlayPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-black">별의 끝에서</h1>
        <p className="text-sm text-muted-foreground">
          기억을 잃은 별의 아이가 되어, 별빛 세계에서 나를 다시 찾아가는 여행.
        </p>
      </div>
      {/* 게임 화면은 본문 폭보다 넓게 */}
      <div className="relative left-1/2 w-[min(1200px,calc(100vw-2rem))] -translate-x-1/2">
        <PlayLoader />
      </div>
    </div>
  );
}
