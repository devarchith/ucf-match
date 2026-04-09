export type AuthContext = {
  userId: string;
  ucfEmail: string;
};

type AuthMode = "dev" | "provider";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export class AuthOperationalError extends Error {
  status: number;
  code: "AUTH_MISCONFIGURED" | "AUTH_PROVIDER_UNIMPLEMENTED" | "AUTH_PROVIDER_UNAVAILABLE";

  constructor(
    message: string,
    status = 503,
    code: "AUTH_MISCONFIGURED" | "AUTH_PROVIDER_UNIMPLEMENTED" | "AUTH_PROVIDER_UNAVAILABLE" = "AUTH_MISCONFIGURED"
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function getAuthContext(): Promise<AuthContext | null> {
  // Placeholder for future auth provider integration.
  return null;
}

function readBearerToken(request: Request): string | null {
  const value = request.headers.get("authorization");
  if (!value) {
    return null;
  }
  const [scheme, token] = value.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

export function resolveDevAuthContext(request: Request): AuthContext {
  if (process.env.NODE_ENV !== "development") {
    throw new AuthOperationalError(
      "Development auth is only allowed in local development.",
      503
    );
  }
  if (process.env.DEV_AUTH_ENABLED !== "true") {
    throw new AuthOperationalError(
      "Development auth is disabled. Set DEV_AUTH_ENABLED=true for local development only.",
      503
    );
  }

  const bearerToken = readBearerToken(request);
  const expectedToken = process.env.DEV_AUTH_TOKEN;
  if (!expectedToken || !bearerToken || bearerToken !== expectedToken) {
    throw new AuthError("Unauthorized", 401);
  }

  const userId = process.env.DEV_AUTH_USER_ID;
  const ucfEmail = process.env.DEV_AUTH_UCF_EMAIL;
  if (!userId || !ucfEmail) {
    throw new AuthOperationalError(
      "Development auth identity is not configured. Set DEV_AUTH_USER_ID and DEV_AUTH_UCF_EMAIL.",
      503
    );
  }

  return { userId, ucfEmail };
}

async function resolveProviderAuthContext(): Promise<AuthContext> {
  const providerEnabled = process.env.AUTH_PROVIDER_ENABLED === "true";
  if (!providerEnabled) {
    throw new AuthOperationalError(
      "Auth provider is not configured. Configure provider auth for staging/production.",
      503,
      "AUTH_MISCONFIGURED"
    );
  }

  try {
    const context = await getAuthContext();
    if (!context) {
      throw new AuthOperationalError(
        "Auth provider is enabled but no auth context was resolved. Provider integration is missing or misconfigured.",
        503,
        "AUTH_PROVIDER_UNIMPLEMENTED"
      );
    }
    return context;
  } catch (error) {
    if (error instanceof AuthError || error instanceof AuthOperationalError) {
      throw error;
    }
    throw new AuthOperationalError(
      "Auth provider is unavailable. Check provider connectivity and configuration.",
      503,
      "AUTH_PROVIDER_UNAVAILABLE"
    );
  }
}

function resolveAuthMode(): AuthMode {
  const explicit = process.env.AUTH_MODE;
  if (explicit === "dev" || explicit === "provider") {
    return explicit;
  }
  if (process.env.NODE_ENV === "development") {
    return "dev";
  }
  return "provider";
}

export function requireAuth(request: Request): AuthContext {
  const mode = resolveAuthMode();
  if (mode === "dev") {
    return resolveDevAuthContext(request);
  }
  throw new AuthOperationalError(
    "Synchronous auth is not available for provider mode. Use requireAuthAsync().",
    503
  );
}

export async function requireAuthAsync(request: Request): Promise<AuthContext> {
  const mode = resolveAuthMode();
  if (mode === "dev") {
    return resolveDevAuthContext(request);
  }
  return resolveProviderAuthContext();
}
