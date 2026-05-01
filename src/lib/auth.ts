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
      // 플리 임포트 + Liked Songs 임포트에 필요한 최소
      scope: [
        "user-read-private",
        "playlist-read-private",
        "playlist-read-collaborative",
        "user-library-read",
      ],
      // Spotify display_name이 null이거나 email이 누락된 케이스 안전망
      getUserInfo: async (token) => {
        const res = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token.accessToken}` },
        });
        if (!res.ok) {
          console.error("[Spotify /me] failed", res.status, await res.text());
          return null;
        }
        const profile = (await res.json()) as {
          id: string;
          display_name: string | null;
          email?: string;
          images?: { url: string }[];
        };
        if (!profile.email) {
          console.error("[Spotify /me] email missing in profile");
          return null;
        }
        return {
          user: {
            id: profile.id,
            name: profile.display_name ?? profile.email,
            email: profile.email,
            image: profile.images?.[0]?.url,
            emailVerified: false,
          },
          data: {
            id: profile.id,
            display_name: profile.display_name ?? profile.email,
            email: profile.email,
            images: profile.images ?? [],
          },
        };
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7일
    updateAge: 60 * 60 * 24, // 1일
  },
});
