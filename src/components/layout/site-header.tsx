import Link from "next/link";
import { HankeutLogo } from "@/components/brand/hankeut-logo";
import { AiStatusBadge } from "./ai-status-badge";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2">
        <Link href="/" aria-label="한끗차이 홈" className="shrink-0">
          <HankeutLogo compact className="h-10 w-auto sm:h-11" />
        </Link>
        <NavLinks />
        <div className="ml-auto hidden sm:block">
          <AiStatusBadge />
        </div>
      </div>
    </header>
  );
}
