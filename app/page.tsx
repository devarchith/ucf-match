import Link from "next/link";
import { ShieldCheck, Sparkles, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { TopNav } from "@/components/top-nav";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { appMeta } from "@/lib/mock/app-data";

export default function LandingPage() {
  return (
    <AppShell title={appMeta.name} subtitle={appMeta.subtitle}>
      <TopNav pathname="/" />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Intentional weekly matching for Knights</CardTitle>
          <CardDescription>{appMeta.trustBlurb}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> UCF email-gated access
            </p>
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4" /> One curated intro each week
            </p>
            <p className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Profile depth over swipe behavior
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/auth" className={buttonVariants()}>
              Get started
            </Link>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              View dashboard shell
            </Link>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
