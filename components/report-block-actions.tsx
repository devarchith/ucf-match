import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { SafetyEntryPoint } from "@/lib/mock/safety";

export function ReportBlockActions({ source }: { source: SafetyEntryPoint }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link
        href={`/report?from=${source}`}
        className={buttonVariants({ variant: "outline", className: "w-full" })}
      >
        Report
      </Link>
      <Link
        href={`/block?from=${source}`}
        className={buttonVariants({ variant: "destructive", className: "w-full" })}
      >
        Block
      </Link>
    </div>
  );
}
