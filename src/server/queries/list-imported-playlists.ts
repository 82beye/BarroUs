import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { nodes } from "@/db/schema";

export type ImportedPlaylist = {
  nodeId: string;
  title: string;
  imageUrl: string | null;
  spotifyId: string | null;
  isLikedSongs: boolean;
  createdAt: Date;
};

/**
 * 사용자가 임포트한 playlist node 목록.
 */
export async function listImportedPlaylists(userId: string): Promise<ImportedPlaylist[]> {
  const rows = await db
    .select({
      nodeId: nodes.id,
      title: nodes.title,
      metadata: nodes.metadata,
      createdAt: nodes.createdAt,
    })
    .from(nodes)
    .where(and(eq(nodes.type, "playlist"), eq(nodes.createdBy, userId)))
    .orderBy(desc(nodes.createdAt))
    .limit(50);

  return rows.map((r) => {
    const meta = r.metadata as {
      image_url?: string | null;
      spotify_id?: string | null;
      is_liked_songs?: boolean;
    };
    return {
      nodeId: r.nodeId,
      title: r.title,
      imageUrl: meta.image_url ?? null,
      spotifyId: meta.spotify_id ?? null,
      isLikedSongs: Boolean(meta.is_liked_songs),
      createdAt: r.createdAt,
    };
  });
}
