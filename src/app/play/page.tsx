import { PlayLoader } from "@/components/play/play-loader";

export default function PlayPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-black">별의 끝에서</h1>
        <p className="text-sm text-muted-foreground">
          멀티버스에서 온 별의 아이와 함께 여행하며, 너의 이야기를 들려줘.
        </p>
      </div>
      {/* 게임 화면은 본문 폭보다 넓게 */}
      <div className="relative left-1/2 w-[min(1200px,calc(100vw-2rem))] -translate-x-1/2">
        <PlayLoader />
      </div>
    </div>
  );
}
