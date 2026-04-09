import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SignedOutPrompt() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>You are not signed in</CardTitle>
        <CardDescription>Sign in with your UCF email to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/auth" className={buttonVariants({ className: "inline-flex w-full sm:w-auto" })}>
          Go to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
