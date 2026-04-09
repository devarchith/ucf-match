import { AppShell } from "@/components/app-shell";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WeeklyOptInPage() {
  return (
    <AppShell title="Weekly opt-in" subtitle="Confirm you want to be considered in this week’s batch.">
      <TopNav pathname="/weekly-opt-in" />
      <Card>
        <CardHeader>
          <CardTitle>Ready for this week?</CardTitle>
          <CardDescription>Opt-in is explicit each cycle to reduce ghosting and stale matches.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
            <input type="checkbox" className="mt-0.5" />
            I confirm I can message and schedule within 48 hours if matched.
          </label>
          <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
            <input type="checkbox" className="mt-0.5" />
            I agree to community and safety expectations for UCF students.
          </label>
          <Button className="w-full">Opt in for this week</Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
