export type AuthContext = {
  userId: string;
  ucfEmail: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  // Placeholder for future auth provider integration.
  return null;
}
