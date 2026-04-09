import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/state-block";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SafetyPage() {
  return (
    <AppShell title="Safety center" subtitle="Simple, student-first guidance for respectful and safe interactions.">
      <TopNav />
      <Card>
        <CardHeader>
          <CardTitle>Personal safety reminders</CardTitle>
          <CardDescription>Keep first meetups public, clear, and low-pressure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>- Meet in visible on-campus areas.</p>
          <p>- Share plans with a trusted friend.</p>
          <p>- End any interaction that feels unsafe.</p>
        </CardContent>
      </Card>
      <EmptyState
        title="Policy details coming soon"
        description="Detailed trust and safety policy pages will be added in a future frontend pass."
      />
    </AppShell>
  );
}
