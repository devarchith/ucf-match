import { AppShell } from "@/components/app-shell";
import { ReportBlockActions } from "@/components/report-block-actions";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveServerSession } from "@/lib/auth/server-user";

export const dynamic = "force-dynamic";

export default async function ConversationPage() {
  const session = await resolveServerSession();
  if (session.status === "signed_out") {
    return (
      <AppShell title="Conversation" subtitle="Keep communication respectful, clear, and on-campus focused.">
        <TopNav pathname="/conversation" />
        <SignedOutPrompt />
      </AppShell>
    );
  }

  return (
    <AppShell title="Conversation" subtitle="Keep communication respectful, clear, and on-campus focused.">
      <TopNav pathname="/conversation" />
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>In-app messaging is not available yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Alert>
            <AlertDescription>
              This feature is not active. There is no live message thread — coordinate with your match
              using the details you already have until messaging launches.
            </AlertDescription>
          </Alert>
          <p className="text-xs text-muted-foreground">
            If something feels off, use Report or Block from your match screen when you have an active
            match context.
          </p>
          <ReportBlockActions source="conversation" />
        </CardContent>
      </Card>
    </AppShell>
  );
}
