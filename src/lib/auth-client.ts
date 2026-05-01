import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL 생략 — same-origin 호출 (BETTER_AUTH_URL과 동일)
});

export const { signIn, signOut, useSession } = authClient;
