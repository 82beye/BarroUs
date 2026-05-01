import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { env } from "@/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env.server.BETTER_AUTH_SECRET,
  baseURL: env.server.BETTER_AUTH_URL,
  socialProviders: {
    spotify: {
      clientId: env.server.SPOTIFY_CLIENT_ID,
      clientSecret: env.server.SPOTIFY_CLIENT_SECRET,
      // Spotify Web API scope — D1 임포트에 필요한 최소
      scope: ["user-read-private", "playlist-read-private", "playlist-read-collaborative"],
    },
  },
  // 사이드 프로젝트라 짧은 세션 + 자동 갱신 OFF (D1 단순화)
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7일
    updateAge: 60 * 60 * 24, // 1일
  },
});
