"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { nodes, shares } from "@/db/schema";
import { auth } from "@/lib/auth";

type CreateShareResult = { ok: true; shareId: string; url: string } | { ok: false; error: string };

/**
 * 노드 공유 링크 발급 (현재는 playlist node만 가정).
 *
 * - 소유권 검증: nodes.created_by === session.userId
 * - 기존 share 있으면 재사용 (D1: 1 node = 1 share)
 * - 없으면 nanoid(10) 발급
 */
export async function createShare(formData: FormData): Promise<CreateShareResult> {
  const nodeId = formData.get("nodeId");
  if (typeof nodeId !== "string" || !nodeId) {
    return { ok: false, error: "nodeId가 누락됐어요." };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // 소유권 검증
  const ownedRows = await db
    .select({ id: nodes.id })
    .from(nodes)
    .where(and(eq(nodes.id, nodeId), eq(nodes.createdBy, session.user.id)))
    .limit(1);

  if (!ownedRows[0]) {
    return { ok: false, error: "본인이 만든 노드만 공유할 수 있어요." };
  }

  // 기존 share 재사용
  const existing = await db
    .select({ shareId: shares.shareId })
    .from(shares)
    .where(and(eq(shares.nodeId, nodeId), eq(shares.createdBy, session.user.id)))
    .limit(1);

  let shareId = existing[0]?.shareId;
  if (!shareId) {
    shareId = nanoid(10);
    await db.insert(shares).values({
      shareId,
      nodeId,
      createdBy: session.user.id,
    });
  }

  // BETTER_AUTH_URL을 origin으로 사용 (Vercel 배포 시 ENV 갈아치우면 됨)
  const origin = (await headers()).get("origin") ?? process.env.BETTER_AUTH_URL ?? "";
  const url = `${origin}/p/${shareId}`;

  return { ok: true, shareId, url };
}
