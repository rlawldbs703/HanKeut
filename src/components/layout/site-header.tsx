import Link from "next/link";
import { AiStatusBadge } from "./ai-status-badge";

const NAV = [
  { href: "/battle", label: "한끗차이" },
  { href: "/tini", label: "MY MINI-TTINI" },
  { href: "/growth", label: "MY GROWTH" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="font-black tracking-tight">
          한끗차이 <span className="text-xs font-medium text-primary">THINK ARENA</span>
        </Link>
        <nav className="flex gap-3 text-sm text-muted-foreground">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <AiStatusBadge />
        </div>
      </div>
    </header>
  );
}
