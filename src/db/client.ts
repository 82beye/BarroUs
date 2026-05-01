import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

// 함정: Supabase pooler (Transaction mode, port 6543)에서는 prepare statements 비활성화 필수
// 참고: https://supabase.com/docs/guides/database/postgres/connection-pooling
const queryClient = postgres(env.server.DATABASE_URL, {
  prepare: false,
  // 사이드 프로젝트라 pool 작게
  max: 5,
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
