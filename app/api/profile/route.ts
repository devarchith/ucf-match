import { NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/route-errors";
import { requireAuthAsync } from "@/lib/auth";
import { createOrUpdateProfile } from "@/lib/profile";
import { profileInputSchema } from "@/lib/validation/profile";

export async function PUT(request: Request) {
  try {
    const auth = await requireAuthAsync(request);
    const body = await request.json();
    const input = profileInputSchema.parse(body);
    const profile = await createOrUpdateProfile(auth.userId, input);
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    return toRouteErrorResponse(error, { route: "/api/profile", method: "PUT", requestId: request.headers.get("x-request-id") });
  }
}
