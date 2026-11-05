import Link from "next/link";
import { HankeutLogo } from "@/components/brand/hankeut-logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    href: "/battle",
    emoji: "⚔️",
    title: "한끗차이",
    desc: "학교·회사·친구·연인 상황에서 AI 상대의 마음 게이지를 움직여 미션을 달성하세요.",
  },
  {
    href: "/tini",
    emoji: "🐣",
    title: "MY MINI-TTINI",
    desc: "직접 꾸민 몽글몽글 먼지 친구에게 고민을 털어놓아요. 답을 대신 써 주지 않고, 스스로 생각하도록 도와줘요.",
  },
  {
    href: "/growth",
    emoji: "📈",
    title: "MY GROWTH",
    desc: "논리력·상황 이해력·표현력 점수와 대결 기록으로 성장 과정을 확인해요.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-5 rounded-3xl border bg-gradient-to-b from-secondary/70 to-background p-6 text-center sm:p-10">
        <h1 className="sr-only">한끗차이</h1>
        <HankeutLogo className="mx-auto h-auto w-full max-w-md" />
        <p className="text-sm font-semibold tracking-widest text-primary/80">THINK ARENA</p>
        <p className="text-xl font-black leading-snug sm:text-2xl">
          AI에게 답을 묻지 말고, AI와 <span className="rounded bg-accent px-1">대결</span>하세요.
        </p>
        <p className="mx-auto max-w-lg text-muted-foreground">
          좋은 대화는 &lsquo;한끗 차이&rsquo;에서 갈려요. 현실 같은 대화 상황에서 직접 문장을 만들고, 상대의 반응과
          평가로 내 표현력을 키워요.
        </p>
        <Link href="/battle" className={buttonVariants({ size: "lg", className: "h-11 px-6 text-base" })}>
          대결 시작하기 →
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="group">
            <Card className="h-full transition group-hover:ring-2 group-hover:ring-accent">
              <CardHeader>
                <div className="text-3xl">{f.emoji}</div>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border bg-background p-5 text-sm">
        <h2 className="mb-2 font-bold">이렇게 진행돼요</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>상황을 고르거나 AI에게 나만의 상황을 만들어 달라고 해요.</li>
          <li>상대의 말에 직접 답해요. AI가 게이지를 올리거나 내리고 그 이유를 알려 줘요.</li>
          <li>정해진 턴 안에 목표 게이지에 도달하면 승리!</li>
          <li>끝나면 3대 역량 평가와 &lsquo;한끗 더 나은 답변&rsquo;을 받아요.</li>
        </ol>
      </section>
    </div>
  );
}
