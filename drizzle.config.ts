import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js와 동일하게 .env.local 우선, .env fallback
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for drizzle-kit (Supabase Transaction mode, port 6543)",
  );
}

export default defineConfig({
  schema: "./src/db/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
