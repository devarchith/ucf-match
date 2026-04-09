import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/state-block";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <AppShell title="Match reveal" subtitle="Preparing your reveal...">
      <LoadingState title="Loading this week's match" />
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    </AppShell>
  );
}
