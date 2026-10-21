import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

/** Jetons renvoyés par /api/auth/login et /api/auth/refresh (durées en secondes). */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

type CookieStore = Pick<ResponseCookies, "set">;

export function isAuthTokens(value: unknown): value is AuthTokens {
  const v = value as Partial<AuthTokens> | null;
  return (
    !!v &&
    typeof v.accessToken === "string" &&
    typeof v.refreshToken === "string" &&
    typeof v.accessTokenExpiresAt === "number" &&
    typeof v.refreshTokenExpiresAt === "number"
  );
}

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
    sameSite: "lax" as const,
  };
}

/** Enregistre les deux jetons : un refresh fait tourner le refresh token, il faut donc toujours remplacer les deux. */
export function setAuthCookies(store: CookieStore, tokens: AuthTokens) {
  store.set("accessToken", tokens.accessToken, authCookieOptions(tokens.accessTokenExpiresAt));
  store.set("refreshToken", tokens.refreshToken, authCookieOptions(tokens.refreshTokenExpiresAt));
}

export function clearAuthCookies(store: CookieStore) {
  store.set("accessToken", "", { maxAge: -1, path: "/" });
  store.set("refreshToken", "", { maxAge: -1, path: "/" });
}
