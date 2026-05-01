import "server-only";
import { aliasedTable, and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { edges, nodes, shares } from "@/db/schema";

export type PlaylistTrack = {
  nodeId: string;
  title: string;
  artists: string[];
  durationMs: number;
  previewUrl: string | null;
  spotifyUrl: string | null;
  albumImageUrl: string | null;
};

export type PlaylistDetail = {
  playlist: {
    nodeId: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    ownerDisplayName: string | null;
    isLikedSongs: boolean;
    createdBy: string | null;
  };
  tracks: PlaylistTrack[];
};

/**
 * playlist node 1개를 detail (트랙 리스트 포함) 형태로 조회.
 * 공유 페이지 / 대시보드 상세 페이지가 공통으로 사용.
 */
export async function getPlaylistDetail(nodeId: string): Promise<PlaylistDetail | null> {
  const head = await db
    .select({
      nodeId: nodes.id,
      type: nodes.type,
      title: nodes.title,
      metadata: nodes.metadata,
      createdBy: nodes.createdBy,
    })
    .from(nodes)
    .where(eq(nodes.id, nodeId))
    .limit(1);

  const row = head[0];
  if (!row || row.type !== "playlist") return null;

  const meta = row.metadata as {
    description?: string | null;
    image_url?: string | null;
    owner_display_name?: string | null;
    is_liked_songs?: boolean;
  };

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

  const tracks: PlaylistTrack[] = trackRows.map((t) => {
    const tm = t.metadata as {
      preview_url?: string | null;
      duration_ms?: number;
      artists?: { name: string }[];
      album_image_url?: string | null;
      spotify_url?: string | null;
    };
    return {
      nodeId: t.nodeId,
      title: t.title,
      artists: tm.artists?.map((a) => a.name) ?? [],
      durationMs: tm.duration_ms ?? 0,
      previewUrl: tm.preview_url ?? null,
      spotifyUrl: tm.spotify_url ?? null,
      albumImageUrl: tm.album_image_url ?? null,
    };
  });

  return {
    playlist: {
      nodeId: row.nodeId,
      title: row.title,
      description: meta.description ?? null,
      imageUrl: meta.image_url ?? null,
      ownerDisplayName: meta.owner_display_name ?? null,
      isLikedSongs: Boolean(meta.is_liked_songs),
      createdBy: row.createdBy ?? null,
    },
    tracks,
  };
}

/**
 * shareId → playlist node id 변환.
 * 공개 페이지 진입점에서 사용.
 */
export async function resolveShareNodeId(shareId: string): Promise<string | null> {
  const rows = await db
    .select({ nodeId: shares.nodeId })
    .from(shares)
    .where(eq(shares.shareId, shareId))
    .limit(1);
  return rows[0]?.nodeId ?? null;
}
