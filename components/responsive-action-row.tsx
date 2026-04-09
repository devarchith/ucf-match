import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ResponsiveActionRow({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", className)}>{children}</div>;
}
