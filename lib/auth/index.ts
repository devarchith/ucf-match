export type AuthContext = {
  userId: string;
  ucfEmail: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  // Placeholder for future auth provider integration.
  return null;
}

export function getRequestAuthContext(request: Request): AuthContext | null {
  const userId = request.headers.get("x-user-id");
  const ucfEmail = request.headers.get("x-ucf-email");
  if (!userId || !ucfEmail) {
    return null;
  }

  return { userId, ucfEmail };
}
