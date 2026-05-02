import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { edges, nodes } from "@/db/schema";
import type { SpotifyArtistDetail } from "@/lib/spotify/artists";
import type { SpotifyTrackItem } from "@/lib/spotify/playlists";

// biome-ignore lint/suspicious/noExplicitAny: Drizzle transaction generic은 너무 길어 단순화
type Tx = PgTransaction<any, any, any>;

/**
 * release_date "YYYY" / "YYYY-MM" / "YYYY-MM-DD" → "YYYY"
 */
function extractYear(release: string | null | undefined): string | null {
  if (!release) return null;
  const m = release.match(/^(\d{4})/);
  return m?.[1] ?? null;
}

type MetaIds = {
  artistsByTrack: Map<string, string[]>; // track spotify_id → artist node ids
  albumByTrack: Map<string, string>;
  yearByTrack: Map<string, string>;
  genresByTrack: Map<string, string[]>; // track → genre node ids (artists의 union)
};

/**
 * 트랙 임포트 시 artist/album/year/genre 노드를 dedupe ensure하고
 * 트랙 → mentions → 메타 edges를 생성한다.
 *
 * 같은 메타는 모든 사용자가 공유 (전역 dedupe). createdBy는 처음 임포트한 사용자.
 *
 * @param tx        Drizzle transaction (또는 db)
 * @param userId    fallback createdBy
 * @param tracks    임포트 중인 트랙들
 * @param trackIdByNodeId  spotify_track_id → track node uuid
 * @param artistGenres     artist spotify_id → SpotifyArtistDetail (선택, genre 포함)
 */
export async function ensureMetaNodes(
  tx: Tx,
  userId: string,
  tracks: SpotifyTrackItem[],
  trackNodeIdBySpotifyId: Map<string, string>,
  artistDetails: Map<string, SpotifyArtistDetail>,
): Promise<MetaIds> {
  // ── 1. 수집 ─────────────────────────────────────────
  const allArtistIds = new Set<string>();
  const allAlbumIds = new Set<string>();
  const allYears = new Set<string>();
  const allGenres = new Set<string>();
  // track.artists에서 가수 이름 fallback (artistDetails fetch 실패 케이스 대비)
  const trackArtistNames = new Map<string, string>();

  for (const t of tracks) {
    for (const a of t.artists ?? []) {
      if (a.id) {
        allArtistIds.add(a.id);
        if (!trackArtistNames.has(a.id) && a.name) {
          trackArtistNames.set(a.id, a.name);
        }
      }
    }
    if (t.album?.id) allAlbumIds.add(t.album.id);
    const year = extractYear(t.album?.release_date);
    if (year) allYears.add(year);
  }
  for (const detail of artistDetails.values()) {
    for (const g of detail.genres ?? []) {
      if (g) allGenres.add(g.toLowerCase());
    }
  }

  // ── 2. ensure artist nodes ─────────────────────────
  const artistIdToNodeId = await ensureBySpotifyId(tx, "artist", allArtistIds, (sid) => {
    const detail = artistDetails.get(sid);
    // title 우선순위: /v1/artists detail.name → track.artists.name → spotify_id
    const title = detail?.name ?? trackArtistNames.get(sid) ?? sid;
    return {
      type: "artist" as const,
      title,
      metadata: {
        spotify_id: sid,
        image_url: detail?.images?.[0]?.url ?? null,
        genres: detail?.genres ?? [],
      },
      createdBy: userId,
    };
  });

  // ── 3. ensure album nodes ──────────────────────────
  const albumIdToNodeId = await ensureBySpotifyId(tx, "album", allAlbumIds, (sid) => {
    const t = tracks.find((tr) => tr.album?.id === sid);
    return {
      type: "album" as const,
      title: t?.album?.name ?? sid,
      metadata: {
        spotify_id: sid,
        image_url: t?.album?.images?.[0]?.url ?? null,
        release_date: t?.album?.release_date ?? null,
      },
      createdBy: userId,
    };
  });

  // ── 4. ensure year nodes ───────────────────────────
  const yearToNodeId = await ensureByValue(tx, "year", allYears, (val) => ({
    type: "year" as const,
    title: val,
    metadata: { value: val },
    createdBy: userId,
  }));

  // ── 5. ensure genre nodes ──────────────────────────
  const genreToNodeId = await ensureByValue(tx, "genre", allGenres, (val) => ({
    type: "genre" as const,
    title: val,
    metadata: { value: val },
    createdBy: userId,
  }));

  // ── 6. mentions edges (track → artist/album/year/genre) ─────
  const edgeValues: { fromNode: string; toNode: string; kind: "mentions" }[] = [];

  for (const t of tracks) {
    if (!t.id) continue;
    const trackNodeId = trackNodeIdBySpotifyId.get(t.id);
    if (!trackNodeId) continue;

    for (const a of t.artists ?? []) {
      const aid = a.id ? artistIdToNodeId.get(a.id) : undefined;
      if (aid) edgeValues.push({ fromNode: trackNodeId, toNode: aid, kind: "mentions" });
    }
    if (t.album?.id) {
      const albId = albumIdToNodeId.get(t.album.id);
      if (albId) edgeValues.push({ fromNode: trackNodeId, toNode: albId, kind: "mentions" });
    }
    const year = extractYear(t.album?.release_date);
    if (year) {
      const yId = yearToNodeId.get(year);
      if (yId) edgeValues.push({ fromNode: trackNodeId, toNode: yId, kind: "mentions" });
    }
    // genres는 트랙 자체엔 없지만 artist를 통해 → 트랙→장르 edge로 직접 연결 (artist 백링크는 별도)
    for (const a of t.artists ?? []) {
      const detail = a.id ? artistDetails.get(a.id) : undefined;
      for (const g of detail?.genres ?? []) {
        const gId = genreToNodeId.get(g.toLowerCase());
        if (gId) edgeValues.push({ fromNode: trackNodeId, toNode: gId, kind: "mentions" });
      }
    }
  }

  if (edgeValues.length > 0) {
    // 100개씩 청크 (Postgres 인자 한도 회피)
    const CHUNK = 500;
    for (let i = 0; i < edgeValues.length; i += CHUNK) {
      await tx
        .insert(edges)
        .values(edgeValues.slice(i, i + CHUNK))
        .onConflictDoNothing();
    }
  }

  // ── 7. 매핑 결과 ───────────────────────────────────
  const result: MetaIds = {
    artistsByTrack: new Map(),
    albumByTrack: new Map(),
    yearByTrack: new Map(),
    genresByTrack: new Map(),
  };
  for (const t of tracks) {
    if (!t.id) continue;
    const aIds = (t.artists ?? [])
      .map((a) => (a.id ? artistIdToNodeId.get(a.id) : undefined))
      .filter((v): v is string => Boolean(v));
    if (aIds.length) result.artistsByTrack.set(t.id, aIds);

    if (t.album?.id) {
      const albId = albumIdToNodeId.get(t.album.id);
      if (albId) result.albumByTrack.set(t.id, albId);
    }
    const year = extractYear(t.album?.release_date);
    if (year) {
      const yId = yearToNodeId.get(year);
      if (yId) result.yearByTrack.set(t.id, yId);
    }
    const gIds: string[] = [];
    for (const a of t.artists ?? []) {
      const detail = a.id ? artistDetails.get(a.id) : undefined;
      for (const g of detail?.genres ?? []) {
        const gid = genreToNodeId.get(g.toLowerCase());
        if (gid) gIds.push(gid);
      }
    }
    if (gIds.length) result.genresByTrack.set(t.id, gIds);
  }
  return result;
}

// ── 헬퍼: spotify_id 기반 dedupe ensure ─────────────────────

async function ensureBySpotifyId(
  tx: Tx,
  type: "artist" | "album",
  ids: Set<string>,
  buildValue: (sid: string) => {
    type: "artist" | "album";
    title: string;
    metadata: Record<string, unknown>;
    createdBy: string;
  },
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (ids.size === 0) return out;
  const list = Array.from(ids);

  const existing = await tx
    .select({
      id: nodes.id,
      sid: sql<string>`(${nodes.metadata}->>'spotify_id')`,
    })
    .from(nodes)
    .where(
      and(eq(nodes.type, type), inArray(sql<string>`(${nodes.metadata}->>'spotify_id')`, list)),
    );
  for (const r of existing) out.set(r.sid, r.id);

  const missing = list.filter((sid) => !out.has(sid));
  if (missing.length > 0) {
    const inserted = await tx
      .insert(nodes)
      .values(missing.map(buildValue))
      .returning({
        id: nodes.id,
        sid: sql<string>`(${nodes.metadata}->>'spotify_id')`,
      });
    for (const r of inserted) out.set(r.sid, r.id);
  }
  return out;
}

async function ensureByValue(
  tx: Tx,
  type: "year" | "genre",
  values: Set<string>,
  buildValue: (val: string) => {
    type: "year" | "genre";
    title: string;
    metadata: Record<string, unknown>;
    createdBy: string;
  },
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (values.size === 0) return out;
  const list = Array.from(values);

  const existing = await tx
    .select({
      id: nodes.id,
      val: sql<string>`(${nodes.metadata}->>'value')`,
    })
    .from(nodes)
    .where(and(eq(nodes.type, type), inArray(sql<string>`(${nodes.metadata}->>'value')`, list)));
  for (const r of existing) out.set(r.val, r.id);

  const missing = list.filter((v) => !out.has(v));
  if (missing.length > 0) {
    const inserted = await tx
      .insert(nodes)
      .values(missing.map(buildValue))
      .returning({
        id: nodes.id,
        val: sql<string>`(${nodes.metadata}->>'value')`,
      });
    for (const r of inserted) out.set(r.val, r.id);
  }
  return out;
}
