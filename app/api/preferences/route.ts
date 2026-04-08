import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getRequestAuthContext } from "@/lib/auth";
import {
  submitPreferences,
  PreferencesServiceError
} from "@/lib/preferences";
import { preferencesInputSchema } from "@/lib/validation/preferences";

export async function PUT(request: Request) {
  try {
    const auth = getRequestAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = preferencesInputSchema.parse(body);
    const preferences = await submitPreferences(auth.userId, input);
    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload.", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof PreferencesServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
