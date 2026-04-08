import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getRequestAuthContext } from "@/lib/auth";
import { createBlock, SafetyServiceError } from "@/lib/safety";
import { blockInputSchema } from "@/lib/validation/block";

export async function POST(request: Request) {
  try {
    const auth = getRequestAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = blockInputSchema.parse(body);
    const block = await createBlock(auth.userId, input);
    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload.", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof SafetyServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
