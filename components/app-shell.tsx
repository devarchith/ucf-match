import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function AppShell({ title, subtitle, children, className }: AppShellProps) {
  return (
    <main className={cn("mx-auto min-h-screen w-full max-w-md px-4 py-6 sm:px-6", className)}>
      <header className="mb-6 space-y-3">
        <Badge variant="secondary" className="rounded-md">
          UCF Students Only
        </Badge>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </main>
  );
}
