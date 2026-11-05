"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/battle", label: "한끗대결", short: "대결" },
  { href: "/tini", label: "MINI-TTINI", short: "티니" },
  { href: "/growth", label: "MY GROWTH", short: "성장" },
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
