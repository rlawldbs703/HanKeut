import { CreateStudio } from "@/components/create/create-studio";

export default function CreatePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black">공동창작</h1>
        <p className="text-sm text-muted-foreground">IDEA → TWIST → CREATE. 내가 방향을 정하고, 한끗 다른 제안으로 함께 발전시켜요.</p>
      </div>
      <CreateStudio />
    </div>
  );
}
