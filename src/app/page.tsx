import Link from "next/link";
import { HankeutLogo } from "@/components/brand/hankeut-logo";
import { TiniCharacter } from "@/components/tini/tini-character";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_AVATAR } from "@/lib/tini/profile";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-3xl border bg-gradient-to-b from-secondary/70 to-background p-6 text-center sm:p-10">
        <h1 className="sr-only">한끗차이</h1>
        <HankeutLogo className="mx-auto h-auto w-full max-w-md" />
        <p className="mx-auto max-w-lg text-muted-foreground">
          별의 아이가 되어 나의 이야기를 되찾고, 미니띠니와 편하게 이야기를 나눠요.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/play" className="group">
          <Card className="h-full overflow-hidden transition group-hover:ring-2 group-hover:ring-accent">
            <div className="flex h-36 items-center justify-center bg-gradient-to-b from-indigo-950 via-violet-900 to-amber-200/60 text-5xl text-amber-100" style={{ textShadow: "0 0 24px #fde68a" }}>
              ✦
            </div>
            <CardHeader>
              <CardTitle>별의 끝에서</CardTitle>
              <CardDescription>
                기억을 잃은 별의 아이가 되어 다섯 장소의 관문을 넘으며 나의 과거·현재·감정·꿈을 떠올려요. 여행의 끝에서 나만을 위한 편지를 받아요.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/tini" className="group">
          <Card className="h-full overflow-hidden transition group-hover:ring-2 group-hover:ring-accent">
            <div className="flex h-36 items-center justify-center bg-gradient-to-b from-secondary to-background">
              <TiniCharacter avatar={DEFAULT_AVATAR} className="h-32 w-32" />
            </div>
            <CardHeader>
              <CardTitle>미니띠니</CardTitle>
              <CardDescription>직접 꾸민 먼지 친구 미니띠니와 일상 이야기부터 고민까지 자연스럽게 대화해요.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </section>
    </div>
  );
}
