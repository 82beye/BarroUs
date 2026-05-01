import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// 노드 타입 — 일반 그래프 + 음악 메타 속성 (artist/album/year/genre)
export const NODE_TYPES = [
  "track",
  "playlist",
  "person",
  "text_note",
  "artist",
  "album",
  "year",
  "genre",
] as const;
export type NodeType = (typeof NODE_TYPES)[number];

// 엣지 종류
export const EDGE_KINDS = ["contains", "authored_by", "mentions"] as const;
export type EdgeKind = (typeof EDGE_KINDS)[number];

export const nodes = pgTable(
  "nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    // 타입별 특수 필드는 metadata JSONB에 저장
    // - track: { spotify_id, preview_url, duration_ms, artists[], album_image_url, album_id, release_date }
    // - playlist: { spotify_id, image_url, owner_display_name, is_liked_songs }
    // - person: { auth_user_id, spotify_id, display_name }
    // - text_note: { body_md, summary }
    // - artist: { spotify_id, image_url, genres[] }
    // - album: { spotify_id, image_url, release_date }
    // - year: { value }  (예: { value: '2023' })
    // - genre: { value } (예: { value: 'k-pop' })
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "nodes_type_check",
      sql`${t.type} IN ('track','playlist','person','text_note','artist','album','year','genre')`,
    ),
    index("nodes_type_idx").on(t.type),
    index("nodes_created_by_idx").on(t.createdBy),
    // track dedupe: 같은 Spotify 트랙은 1개 node로 통합
    uniqueIndex("nodes_track_spotify_id_uniq")
      .on(sql`(metadata->>'spotify_id')`)
      .where(sql`${t.type} = 'track'`),
    // person → auth.user 빠른 lookup
    index("nodes_person_auth_user_idx")
      .on(sql`(metadata->>'auth_user_id')`)
      .where(sql`${t.type} = 'person'`),
    // 메타 노드 dedupe (전역 — 사용자 무관, 모두가 공유)
    uniqueIndex("nodes_artist_spotify_id_uniq")
      .on(sql`(metadata->>'spotify_id')`)
      .where(sql`${t.type} = 'artist'`),
    uniqueIndex("nodes_album_spotify_id_uniq")
      .on(sql`(metadata->>'spotify_id')`)
      .where(sql`${t.type} = 'album'`),
    uniqueIndex("nodes_year_value_uniq")
      .on(sql`(metadata->>'value')`)
      .where(sql`${t.type} = 'year'`),
    uniqueIndex("nodes_genre_value_uniq")
      .on(sql`(metadata->>'value')`)
      .where(sql`${t.type} = 'genre'`),
  ],
);

export const edges = pgTable(
  "edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromNode: uuid("from_node")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    toNode: uuid("to_node")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("edges_kind_check", sql`${t.kind} IN ('contains','authored_by','mentions')`),
    // 동일 (from, to, kind) 중복 방지 — onConflictDoNothing 활용
    uniqueIndex("edges_from_to_kind_uniq").on(t.fromNode, t.toNode, t.kind),
    index("edges_from_kind_idx").on(t.fromNode, t.kind),
    index("edges_to_kind_idx").on(t.toNode, t.kind),
  ],
);
