import { PlayLoader } from "@/components/play/play-loader";

export default function PlayPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-black">④ PLAY · 별의 끝에서</h1>
        <p className="text-sm text-muted-foreground">
          공동창작으로 만든 기억이 잊혀진 정원에 나타나요. PC: ←→↑↓ 이동, Space 살펴보기 · 모바일: 아래 버튼
        </p>
      </div>
      <PlayLoader />
    </div>
  );
}
