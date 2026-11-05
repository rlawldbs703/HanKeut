import { TiniStudio } from "@/components/tini/tini-studio";

export default function TiniPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black">미니띠니</h1>
        <p className="text-sm text-muted-foreground">직접 꾸민 몽글몽글 먼지 친구와 편하게 이야기해요.</p>
      </div>
      <TiniStudio />
    </div>
  );
}
