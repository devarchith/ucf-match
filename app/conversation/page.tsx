import { AppShell } from "@/components/app-shell";
import { ReportBlockActions } from "@/components/report-block-actions";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConversationPage() {
  return (
    <AppShell title="Conversation" subtitle="Keep communication respectful, clear, and on-campus focused.">
      <TopNav />
      <Card>
        <CardHeader>
          <CardTitle>Message thread</CardTitle>
          <CardDescription>This screen is a UI shell for one weekly match conversation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md border p-3">You: Want to meet at the Student Union this week?</div>
          <div className="rounded-md border p-3">Match: Thursday evening works for me.</div>
          <p className="text-xs text-muted-foreground">
            If something feels off, use report or block immediately.
          </p>
          <ReportBlockActions source="conversation" />
        </CardContent>
      </Card>
    </AppShell>
  );
}
