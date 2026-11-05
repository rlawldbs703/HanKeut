"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/play", label: "별의 끝에서", short: "별의 끝에서" },
  { href: "/tini", label: "미니띠니", short: "미니띠니" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 text-sm">
      {NAV.map((n) => {
        const active = pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
              active && "bg-accent text-accent-foreground"
            )}
          >
            <span className="sm:hidden">{n.short}</span>
            <span className="hidden sm:inline">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
