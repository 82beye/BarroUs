// nodes type check + 4개 partial unique index를 직접 ALTER로 적용.
// drizzle-kit push가 check constraint introspection에서 crash하는 우회.
//
// 한 번 실행: `node scripts/apply-meta-schema.mjs`

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 15 });

const statements = [
  `ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_type_check`,
  `ALTER TABLE nodes ADD CONSTRAINT nodes_type_check
    CHECK (type IN ('track','playlist','person','text_note','artist','album','year','genre'))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS nodes_artist_spotify_id_uniq
    ON nodes ((metadata->>'spotify_id')) WHERE type = 'artist'`,
  `CREATE UNIQUE INDEX IF NOT EXISTS nodes_album_spotify_id_uniq
    ON nodes ((metadata->>'spotify_id')) WHERE type = 'album'`,
  `CREATE UNIQUE INDEX IF NOT EXISTS nodes_year_value_uniq
    ON nodes ((metadata->>'value')) WHERE type = 'year'`,
  `CREATE UNIQUE INDEX IF NOT EXISTS nodes_genre_value_uniq
    ON nodes ((metadata->>'value')) WHERE type = 'genre'`,
];

try {
  for (const s of statements) {
    console.log("→", s.replace(/\s+/g, " ").slice(0, 100));
    await sql.unsafe(s);
    console.log("  ✓");
  }
  console.log("\n[done] meta schema applied");
} catch (err) {
  console.error("[failed]", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
