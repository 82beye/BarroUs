import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { nodes } from "./graph";

// 공유 링크 — 어떤 node든 공유 가능 (D1: playlist만, 추후 노트도)
// share_id는 nanoid(10), URL slug
export const shares = pgTable("shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  shareId: text("share_id").notNull().unique(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => nodes.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
