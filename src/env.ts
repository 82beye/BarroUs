import { z } from "zod";

// 서버 전용 환경변수 — 클라이언트 번들에 절대 노출 금지
const serverSchema = z.object({
  SPOTIFY_CLIENT_ID: z.string().min(1, "SPOTIFY_CLIENT_ID is required"),
  SPOTIFY_CLIENT_SECRET: z.string().min(1, "SPOTIFY_CLIENT_SECRET is required"),
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid URL (Supabase Transaction mode, port 6543)"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be >= 32 chars (openssl rand -base64 32)"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
});

// 클라이언트 노출 가능 (NEXT_PUBLIC_*)
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
});

const isServer = typeof window === "undefined";

const parseServer = () => {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables. See logs above.");
  }
  return parsed.data;
};

const parseClient = () => {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  if (!parsed.success) {
    console.error("❌ Invalid client environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment variables. See logs above.");
  }
  return parsed.data;
};

export const env = {
  client: parseClient(),
  // 서버 환경변수는 서버 코드에서만 접근 — 클라이언트 import 시점에 throw
  get server() {
    if (!isServer) {
      throw new Error("env.server is only accessible on the server");
    }
    return parseServer();
  },
};
