import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { nodes } from "@/db/schema";

/**
 * Spotify로 로그인한 auth user에 대응되는 person node를 보장한다.
 *
 * - 1 user = 1 person node 모델
 * - lookup 키: nodes.metadata->>'auth_user_id' = userId AND type='person'
 * - 부분 인덱스 nodes_person_auth_user_idx 활용
 *
 * 로그인 직후 또는 첫 임포트 진입점에서 호출.
 */
export async function ensurePersonNode(
  userId: string,
  displayName: string,
): Promise<{ nodeId: string }> {
  const existing = await db
    .select({ id: nodes.id })
    .from(nodes)
    .where(and(eq(nodes.type, "person"), sql`${nodes.metadata}->>'auth_user_id' = ${userId}`))
    .limit(1);

  if (existing[0]) {
    return { nodeId: existing[0].id };
  }

  const [created] = await db
    .insert(nodes)
    .values({
      type: "person",
      title: displayName,
      metadata: { auth_user_id: userId, display_name: displayName },
      createdBy: userId,
    })
    .returning({ id: nodes.id });

  if (!created) {
    throw new Error(`Failed to create person node for user ${userId}`);
  }
  return { nodeId: created.id };
}
