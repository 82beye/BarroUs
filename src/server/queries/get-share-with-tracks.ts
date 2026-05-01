import "server-only";
import { aliasedTable, and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { edges, nodes, shares } from "@/db/schema";

export type SharePlaylistTrack = {
  nodeId: string;
  title: string;
  artists: string[];
  durationMs: number;
  previewUrl: string | null;
  spotifyUrl: string | null;
  albumImageUrl: string | null;
};

export type SharePlaylist = {
  shareId: string;
  playlist: {
    nodeId: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    ownerDisplayName: string | null;
  };
  tracks: SharePlaylistTrack[];
};

/**
 * shareId로 공개 페이지 데이터를 한 번에 가져온다.
 * 미존재 또는 타입 불일치(현재 playlist만 지원) → null.
 */
export async function getShareWithTracks(shareId: string): Promise<SharePlaylist | null> {
  // 1) share + playlist node
  const head = await db
    .select({
      shareId: shares.shareId,
      nodeId: nodes.id,
      type: nodes.type,
      title: nodes.title,
      metadata: nodes.metadata,
    })
    .from(shares)
    .innerJoin(nodes, eq(nodes.id, shares.nodeId))
    .where(eq(shares.shareId, shareId))
    .limit(1);

  const row = head[0];
  if (!row || row.type !== "playlist") return null;

  const playlistMeta = row.metadata as {
    description?: string | null;
    image_url?: string | null;
    owner_display_name?: string | null;
  };

  // 2) contains 엣지로 트랙 nodes 조회
  const trackNodes = aliasedTable(nodes, "track_nodes");
  const trackRows = await db
    .select({
      nodeId: trackNodes.id,
      title: trackNodes.title,
      metadata: trackNodes.metadata,
      createdAt: edges.createdAt,
    })
    .from(edges)
    .innerJoin(trackNodes, eq(trackNodes.id, edges.toNode))
    .where(and(eq(edges.fromNode, row.nodeId), eq(edges.kind, "contains")))
    .orderBy(asc(edges.createdAt));

  const tracks: SharePlaylistTrack[] = trackRows.map((t) => {
    const meta = t.metadata as {
      preview_url?: string | null;
      duration_ms?: number;
      artists?: { name: string }[];
      album_image_url?: string | null;
      spotify_url?: string | null;
    };
    return {
      nodeId: t.nodeId,
      title: t.title,
      artists: meta.artists?.map((a) => a.name) ?? [],
      durationMs: meta.duration_ms ?? 0,
      previewUrl: meta.preview_url ?? null,
      spotifyUrl: meta.spotify_url ?? null,
      albumImageUrl: meta.album_image_url ?? null,
    };
  });

  return {
    shareId: row.shareId,
    playlist: {
      nodeId: row.nodeId,
      title: row.title,
      description: playlistMeta.description ?? null,
      imageUrl: playlistMeta.image_url ?? null,
      ownerDisplayName: playlistMeta.owner_display_name ?? null,
    },
    tracks,
  };
}
