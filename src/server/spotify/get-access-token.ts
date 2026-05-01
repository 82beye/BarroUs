import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { account } from "@/db/schema";

/**
 * 로그인한 사용자의 Spotify access token 가져오기.
 * 만료된 경우 null 반환 → 호출 측에서 redirect("/login?reason=expired").
 *
 * D1: 자동 refresh 안 함 (계획서 의사결정 #3). D2 첫 항목으로 분리.
 */
export async function getValidSpotifyToken(userId: string): Promise<string | null> {
  const rows = await db
    .select({
      accessToken: account.accessToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "spotify")))
    .limit(1);

  const row = rows[0];
  if (!row?.accessToken) return null;

  // 만료 확인 (Better-Auth가 expires_at 자동 저장). 30초 마진.
  if (row.accessTokenExpiresAt && row.accessTokenExpiresAt.getTime() < Date.now() + 30_000) {
    return null;
  }
  return row.accessToken;
}
