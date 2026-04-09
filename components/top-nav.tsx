import Link from "next/link";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/weekly-opt-in", label: "Opt-in" },
  { href: "/match", label: "Match" }
];

export function TopNav({ pathname }: { pathname?: string }) {
  return (
    <nav className="mb-4 flex flex-wrap gap-2 text-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md border px-3 py-1.5 transition-colors hover:bg-secondary",
            pathname === item.href ? "bg-secondary font-medium" : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
