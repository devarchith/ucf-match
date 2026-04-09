import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { SafetyEntryPoint } from "@/lib/safety/entry-point";

export function ReportBlockActions({
  source,
  otherUserId,
  matchId
}: {
  source: SafetyEntryPoint;
  otherUserId?: string;
  matchId?: string;
}) {
  const reportHref =
    otherUserId != null && otherUserId.length > 0
      ? `/report?from=${source}&reportedUserId=${encodeURIComponent(otherUserId)}${
          matchId && matchId.length > 0
            ? `&matchId=${encodeURIComponent(matchId)}`
            : ""
        }`
      : `/report?from=${source}`;

  const blockHref =
    otherUserId != null && otherUserId.length > 0
      ? `/block?from=${source}&blockedUserId=${encodeURIComponent(otherUserId)}`
      : `/block?from=${source}`;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Link href={reportHref} className={buttonVariants({ variant: "outline", className: "w-full" })}>
        Report
      </Link>
      <Link href={blockHref} className={buttonVariants({ variant: "destructive", className: "w-full" })}>
        Block
      </Link>
    </div>
  );
}
