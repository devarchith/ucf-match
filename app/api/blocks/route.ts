import { NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/route-errors";
import { requireAuthAsync } from "@/lib/auth";
import { createBlock } from "@/lib/safety";
import { blockInputSchema } from "@/lib/validation/block";

export async function POST(request: Request) {
  try {
    const auth = await requireAuthAsync(request);
    const body = await request.json();
    const input = blockInputSchema.parse(body);
    const block = await createBlock(auth.userId, input);
    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    return toRouteErrorResponse(error, { route: "/api/blocks", method: "POST", requestId: request.headers.get("x-request-id") });
  }
}
