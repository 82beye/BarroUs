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

// 노드 타입 — 처음부터 일반 그래프 모델 (음악 도메인 특화 X)
export const NODE_TYPES = ["track", "playlist", "person", "text_note"] as const;
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
    // - track: { spotify_id, preview_url, duration_ms, artists[], album_image_url }
    // - playlist: { spotify_id, image_url, owner_display_name }
    // - person: { auth_user_id, spotify_id, display_name }
    // - text_note: { body_md, summary }
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("nodes_type_check", sql`${t.type} IN ('track','playlist','person','text_note')`),
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
