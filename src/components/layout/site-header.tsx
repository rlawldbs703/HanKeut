import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { HankeutLogo } from "@/components/brand/hankeut-logo";
import { AiStatusBadge } from "./ai-status-badge";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2">
        <Link href="/" aria-label="한끗차이 홈" className="flex shrink-0 items-center gap-2">
          {/* 그림 로고 (틸론 GPU로 만든 심볼) + 글자 로고 */}
          <Image src="/generated/logo-mark.png" alt="" width={40} height={40} priority className="size-9 rounded-[22%] sm:size-10" />
          <HankeutLogo compact className="h-10 w-auto sm:h-11" />
        </Link>
        {/* 현재 주소는 요청 때 정해지므로 Suspense로 감싸요 */}
        <Suspense fallback={<div className="h-7 flex-1" />}>
          <NavLinks />
        </Suspense>
        <div className="ml-auto hidden sm:block">
          <AiStatusBadge />
        </div>
      </div>
    </header>
  );
}
