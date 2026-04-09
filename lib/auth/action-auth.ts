/** Returned on `ok: false` from server actions when the user is not authenticated. */
export const SERVER_ACTION_UNAUTHORIZED = "UNAUTHORIZED" as const;

export type ServerActionUnauthorized = typeof SERVER_ACTION_UNAUTHORIZED;
