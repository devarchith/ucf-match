import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-semibold">UCF Match</h1>
      <p className="text-muted-foreground">
        Base project scaffold for a UCF-only weekly student matching app.
      </p>
      <div className="flex gap-4">
        <Link className="underline" href="/matches">
          Matches
        </Link>
        <Link className="underline" href="/safety">
          Safety
        </Link>
      </div>
    </main>
  );
}
