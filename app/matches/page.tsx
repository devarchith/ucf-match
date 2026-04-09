import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/state-block";
import { TopNav } from "@/components/top-nav";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MatchesPage() {
  return (
    <AppShell title="Weekly matches" subtitle="One intentional introduction per cycle, built for UCF students.">
      <TopNav />
      <Card>
        <CardHeader>
          <CardTitle>Current cycle</CardTitle>
          <CardDescription>Use your dashboard to stay eligible and ready for reveal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard" className={buttonVariants({ className: "w-full" })}>
            Go to dashboard
          </Link>
        </CardContent>
      </Card>
      <EmptyState
        title="No match history yet"
        description="Past cycles and archived intros will appear here once match history UI is connected."
      />
    </AppShell>
  );
}
