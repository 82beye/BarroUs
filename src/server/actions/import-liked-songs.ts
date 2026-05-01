"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { edges, nodes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { SpotifyAuthExpiredError } from "@/lib/spotify/client";
import { getLikedTracks } from "@/lib/spotify/playlists";
import { ensurePersonNode } from "@/server/auth/ensure-person-node";
import { getValidSpotifyToken } from "@/server/spotify/get-access-token";

type ImportResult = { ok: true; nodeId: string } | { ok: false; error: string };

/**
 * Spotify "Liked Songs"(Saved Tracks)를 임포트.
 *
 * 데이터 모델:
 * - playlist node로 표현하되 metadata.is_liked_songs=true 플래그로 구분 (spotify_id 없음)
 * - 사용자별 1개만 (재임포트 시 같은 node에 트랙 추가, 트랙은 dedupe)
 */
export async function importLikedSongs(): Promise<ImportResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const accessToken = await getValidSpotifyToken(session.user.id);
  if (!accessToken) redirect("/login?reason=expired");

  let trackItems: Awaited<ReturnType<typeof getLikedTracks>>;
  try {
    trackItems = await getLikedTracks(accessToken);
  } catch (err) {
    if (err instanceof SpotifyAuthExpiredError) redirect("/login?reason=expired");
    console.error("getLikedTracks failed", err);
    return { ok: false, error: "Spotify 좋아요 곡을 가져오지 못했어요." };
  }

  const { nodeId: personNodeId } = await ensurePersonNode(
    session.user.id,
    session.user.name ?? session.user.email,
  );

  const playlistNodeId = await db.transaction(async (tx) => {
    // 1) Liked Songs playlist node — 사용자별 1개. 있으면 재사용, 없으면 생성.
    const existing = await tx
      .select({ id: nodes.id })
      .from(nodes)
      .where(
        and(
          eq(nodes.type, "playlist"),
          eq(nodes.createdBy, session.user.id),
          sql`(${nodes.metadata}->>'is_liked_songs') = 'true'`,
        ),
      )
      .limit(1);

    let playlistId = existing[0]?.id;
    if (!playlistId) {
      const [created] = await tx
        .insert(nodes)
        .values({
          type: "playlist",
          title: `좋아요 곡 — ${session.user.name ?? session.user.email}`,
          metadata: {
            is_liked_songs: true,
            spotify_id: null,
            description: "Spotify Saved Tracks",
            owner_id: session.user.id,
            owner_display_name: session.user.name ?? session.user.email,
          },
          createdBy: session.user.id,
        })
        .returning({ id: nodes.id });
      if (!created) throw new Error("Liked Songs playlist node insert failed");
      playlistId = created.id;
    } else {
      // 트랙 수 갱신을 위해 updated_at 터치 (옵션 — D1 단순화로 생략 가능)
      await tx.update(nodes).set({ updatedAt: new Date() }).where(eq(nodes.id, playlistId));
    }

    // 2) 트랙 dedupe: SELECT 기존 + INSERT 미존재
    const spotifyIds = trackItems.map((t) => t.id ?? null).filter((v): v is string => Boolean(v));
    const trackNodeIds: string[] = [];

    if (spotifyIds.length > 0) {
      const existingTracks = await tx
        .select({
          id: nodes.id,
          spotifyId: sql<string>`(${nodes.metadata}->>'spotify_id')`,
        })
        .from(nodes)
        .where(
          and(
            eq(nodes.type, "track"),
            inArray(sql<string>`(${nodes.metadata}->>'spotify_id')`, spotifyIds),
          ),
        );

      const idBySpotify = new Map<string, string>();
      for (const row of existingTracks) idBySpotify.set(row.spotifyId, row.id);

      const missing = trackItems.filter((t) => t.id && !idBySpotify.has(t.id));
      if (missing.length > 0) {
        const inserted = await tx
          .insert(nodes)
          .values(
            missing.map((t) => ({
              type: "track" as const,
              title: t.name,
              metadata: {
                spotify_id: t.id,
                preview_url: t.preview_url ?? null,
                duration_ms: t.duration_ms ?? 0,
                artists: (t.artists ?? []).map((a) => ({ id: a.id, name: a.name })),
                album_image_url: t.album?.images?.[0]?.url ?? null,
                spotify_url: t.external_urls?.spotify ?? null,
              },
              createdBy: session.user.id,
            })),
          )
          .returning({
            id: nodes.id,
            spotifyId: sql<string>`(${nodes.metadata}->>'spotify_id')`,
          });
        for (const row of inserted) idBySpotify.set(row.spotifyId, row.id);
      }

      for (const t of trackItems) {
        if (!t.id) continue;
        const id = idBySpotify.get(t.id);
        if (id) trackNodeIds.push(id);
      }
    }

    // 3) edges: playlist→authored_by→person + playlist→contains→track
    const edgeValues = [
      { fromNode: playlistId, toNode: personNodeId, kind: "authored_by" as const },
      ...trackNodeIds.map((trackId) => ({
        fromNode: playlistId,
        toNode: trackId,
        kind: "contains" as const,
      })),
    ];

    if (edgeValues.length > 0) {
      await tx.insert(edges).values(edgeValues).onConflictDoNothing();
    }

    return playlistId;
  });

  revalidatePath("/dashboard");
  return { ok: true, nodeId: playlistNodeId };
}
