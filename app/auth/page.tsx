import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  return (
    <AppShell title="Sign in or create account" subtitle="Use your UCF email to continue.">
      <TopNav />
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Account forms are UI-only until auth contracts are finalized.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">UCF Email</Label>
            <Input id="email" type="email" placeholder="knight@ucf.edu" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button>Sign In</Button>
            <Button variant="outline">Sign Up</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Next step preview: <Link href="/onboarding" className="underline">complete onboarding</Link>.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
