import { GrowthDashboard } from "@/components/growth/growth-dashboard";

export default function GrowthPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black">MY GROWTH 📈</h1>
        <p className="text-sm text-muted-foreground">대결 기록과 역량 점수로 성장 과정을 확인해요. (이 브라우저에 저장돼요)</p>
      </div>
      <GrowthDashboard />
    </div>
  );
}
