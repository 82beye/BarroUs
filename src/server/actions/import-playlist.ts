"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { edges, nodes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getArtistsByIds } from "@/lib/spotify/artists";
import { SpotifyApiError, SpotifyAuthExpiredError, spotifyFetch } from "@/lib/spotify/client";
import { getPlaylistTracks } from "@/lib/spotify/playlists";
import { ensurePersonNode } from "@/server/auth/ensure-person-node";
import { ensureMetaNodes } from "@/server/graph/ensure-meta-nodes";
import { getValidSpotifyToken } from "@/server/spotify/get-access-token";

type ImportResult = { ok: true; nodeId: string } | { ok: false; error: string };

type SpotifyPlaylistDetail = {
  id: string;
  name: string;
  description: string | null;
  images: { url: string }[] | null;
  owner: { id: string; display_name: string | null };
};

/**
 * 플리 임포트 — playlist node + track nodes + edges 생성.
 *
 * 트랜잭션 보장:
 * - track dedupe: SELECT 후 미존재만 INSERT (부분 unique 인덱스가 race 안전망)
 * - edge dedupe: edges_from_to_kind_uniq + onConflictDoNothing
 * - 부분 실패 시 전체 롤백
 */
export async function importPlaylist(formData: FormData): Promise<ImportResult> {
  const playlistId = formData.get("playlistId");
  if (typeof playlistId !== "string" || !playlistId) {
    return { ok: false, error: "playlistId가 누락됐어요." };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const accessToken = await getValidSpotifyToken(session.user.id);
  if (!accessToken) redirect("/login?reason=expired");

  // 1) Spotify 플리 메타 + 트랙 가져오기
  let playlistMeta: SpotifyPlaylistDetail;
  let trackItems: Awaited<ReturnType<typeof getPlaylistTracks>>;
  try {
    [playlistMeta, trackItems] = await Promise.all([
      spotifyFetch<SpotifyPlaylistDetail>(
        accessToken,
        `/playlists/${encodeURIComponent(playlistId)}?fields=id,name,description,images.url,owner(id,display_name)`,
      ),
      getPlaylistTracks(accessToken, playlistId),
    ]);
  } catch (err) {
    if (err instanceof SpotifyAuthExpiredError) redirect("/login?reason=expired");
    if (err instanceof SpotifyApiError && err.status === 403) {
      console.error("Spotify 403 on playlist import", { playlistId, body: err.body });
      return {
        ok: false,
        error: "이 플리는 임포트할 수 없어요 (비공개 또는 권한 부족).",
      };
    }
    if (err instanceof SpotifyApiError && err.status === 404) {
      return { ok: false, error: "플리를 찾을 수 없어요." };
    }
    console.error("Spotify fetch failed", err);
    return { ok: false, error: "Spotify에서 플리를 가져오지 못했어요." };
  }

  // 2) person node 보장
  const { nodeId: personNodeId } = await ensurePersonNode(
    session.user.id,
    session.user.name ?? session.user.email,
  );

  // 2.5) artist genres 사전 fetch (트랜잭션 외부 — 외부 API 호출이라)
  const allArtistIds = Array.from(
    new Set(
      trackItems.flatMap((t) => (t.artists ?? []).map((a) => a.id).filter(Boolean) as string[]),
    ),
  );
  const artistDetails = await getArtistsByIds(accessToken, allArtistIds).catch((err) => {
    console.error("getArtistsByIds failed (genres skipped)", err);
    return new Map();
  });

  // 3) 트랜잭션: playlist node + track nodes + edges
  const playlistNodeId = await db.transaction(async (tx) => {
    // 3-1) playlist node insert (사용자별로 새로 생성 — D1 의사결정 #7)
    const [playlistRow] = await tx
      .insert(nodes)
      .values({
        type: "playlist",
        title: playlistMeta.name,
        metadata: {
          spotify_id: playlistMeta.id,
          description: playlistMeta.description ?? null,
          image_url: playlistMeta.images?.[0]?.url ?? null,
          owner_id: playlistMeta.owner.id,
          owner_display_name: playlistMeta.owner.display_name ?? null,
        },
        createdBy: session.user.id,
      })
      .returning({ id: nodes.id });

    if (!playlistRow) throw new Error("playlist node insert failed");

    // 3-2) track nodes — SELECT 기존 + INSERT 미존재
    const spotifyIds = trackItems.map((t) => t.id ?? null).filter((v): v is string => Boolean(v));
    const trackNodeIds: string[] = [];
    const trackNodeIdBySpotifyId = new Map<string, string>();

    if (spotifyIds.length > 0) {
      // 기존 track lookup (부분 unique 인덱스 활용)
      const existing = await tx
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

      for (const row of existing) {
        trackNodeIdBySpotifyId.set(row.spotifyId, row.id);
      }

      // 미존재 트랙만 INSERT
      const missing = trackItems.filter((t) => t.id && !trackNodeIdBySpotifyId.has(t.id));
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
                album_id: t.album?.id ?? null,
                album_name: t.album?.name ?? null,
                album_image_url: t.album?.images?.[0]?.url ?? null,
                release_date: t.album?.release_date ?? null,
                spotify_url: t.external_urls?.spotify ?? null,
              },
              createdBy: session.user.id,
            })),
          )
          .returning({
            id: nodes.id,
            spotifyId: sql<string>`(${nodes.metadata}->>'spotify_id')`,
          });
        for (const row of inserted) {
          trackNodeIdBySpotifyId.set(row.spotifyId, row.id);
        }
      }

      // 원본 순서대로 트랙 node id 모으기
      for (const t of trackItems) {
        if (!t.id) continue;
        const id = trackNodeIdBySpotifyId.get(t.id);
        if (id) trackNodeIds.push(id);
      }
    }

    // 3-3) edges bulk insert (중복은 onConflictDoNothing)
    const edgeValues = [
      {
        fromNode: playlistRow.id,
        toNode: personNodeId,
        kind: "authored_by" as const,
      },
      ...trackNodeIds.map((trackId) => ({
        fromNode: playlistRow.id,
        toNode: trackId,
        kind: "contains" as const,
      })),
    ];

    if (edgeValues.length > 0) {
      await tx.insert(edges).values(edgeValues).onConflictDoNothing();
    }

    // 3-4) 메타 노드 (artist/album/year/genre) + track→mentions→meta edges
    if (trackItems.length > 0 && trackNodeIdBySpotifyId.size > 0) {
      await ensureMetaNodes(tx, session.user.id, trackItems, trackNodeIdBySpotifyId, artistDetails);
    }

    return playlistRow.id;
  });

  revalidatePath("/dashboard");
  return { ok: true, nodeId: playlistNodeId };
}
