import { TiniStudio } from "@/components/tini/tini-studio";

export default function TiniPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black">MY MINI-TTINI 🐣</h1>
        <p className="text-sm text-muted-foreground">직접 꾸민 AI 친구와 고민을 나눠요.</p>
      </div>
      <TiniStudio />
    </div>
  );
}
