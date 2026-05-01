import "server-only";
import { z } from "zod";
import { spotifyFetch } from "./client";

// ── 응답 zod 스키마 (any 금지 — 미리 검증) ────────────────────────

// Spotify는 일부 필드를 누락하거나 null로 보낼 수 있음 — lenient하게.
const SpotifyImage = z.object({ url: z.string() });

const SpotifyOwner = z.object({
  id: z.string(),
  display_name: z.string().nullish(),
});

const SpotifyPlaylistSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    images: z.array(SpotifyImage).nullish(),
    owner: SpotifyOwner,
    tracks: z.object({ total: z.number().int().nonnegative() }).nullish(),
  })
  .passthrough();

const SpotifyArtist = z.object({ id: z.string(), name: z.string() });

const SpotifyAlbum = z
  .object({
    id: z.string(),
    name: z.string(),
    images: z.array(SpotifyImage).nullish(),
  })
  .passthrough();

const SpotifyTrack = z
  .object({
    id: z.string().nullable(), // local 트랙은 null
    name: z.string(),
    artists: z.array(SpotifyArtist),
    album: SpotifyAlbum,
    duration_ms: z.number().int().nonnegative(),
    preview_url: z.string().nullable(),
    external_urls: z.object({ spotify: z.string() }).nullish(),
    is_local: z.boolean().optional(),
  })
  .passthrough();

const SpotifyPlaylistTrackItem = z
  .object({
    track: SpotifyTrack.nullable(),
  })
  .passthrough();

const SpotifyPaging = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    next: z.string().nullable(),
  });

// ── 외부에서 쓸 타입 ──────────────────────────────────────────────

export type SpotifyPlaylistSummary = z.infer<typeof SpotifyPlaylistSummarySchema>;
export type SpotifyTrackItem = z.infer<typeof SpotifyTrack>;

// ── API 함수 ──────────────────────────────────────────────────────

/**
 * 로그인한 사용자의 플리 목록 (페이지네이션 포함).
 * Spotify 한 번에 최대 50개. 사이드 프로젝트라 200개에서 cap.
 */
export async function listMyPlaylists(accessToken: string): Promise<SpotifyPlaylistSummary[]> {
  const PAGE_LIMIT = 50;
  const HARD_CAP = 200;
  const out: SpotifyPlaylistSummary[] = [];
  let url: string | null = `/me/playlists?limit=${PAGE_LIMIT}`;

  while (url && out.length < HARD_CAP) {
    const raw = await spotifyFetch<unknown>(accessToken, url);
    const page = SpotifyPaging(SpotifyPlaylistSummarySchema).parse(raw);
    out.push(...page.items);
    url = page.next;
  }
  return out.slice(0, HARD_CAP);
}

/**
 * 사용자의 Liked Songs (Saved Tracks).
 * scope: user-library-read 필요. 응답 형식은 plain track 배열.
 */
export async function getLikedTracks(accessToken: string): Promise<SpotifyTrackItem[]> {
  const PAGE_LIMIT = 50; // /me/tracks 최대 50
  const out: SpotifyTrackItem[] = [];
  let url: string | null = `/me/tracks?limit=${PAGE_LIMIT}`;

  while (url) {
    const raw = await spotifyFetch<unknown>(accessToken, url);
    const page = SpotifyPaging(SpotifyPlaylistTrackItem).parse(raw);
    for (const item of page.items) {
      if (!item.track) continue;
      if (item.track.is_local) continue;
      if (!item.track.id) continue;
      out.push(item.track);
    }
    url = page.next;
  }
  return out;
}

/**
 * 플리의 트랙 전체 (페이지네이션). is_local 또는 track==null은 제외.
 */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
): Promise<SpotifyTrackItem[]> {
  const PAGE_LIMIT = 100; // 트랙 페이지는 최대 100
  const out: SpotifyTrackItem[] = [];
  let url: string | null =
    `/playlists/${encodeURIComponent(playlistId)}/tracks?limit=${PAGE_LIMIT}`;

  while (url) {
    const raw = await spotifyFetch<unknown>(accessToken, url);
    const page = SpotifyPaging(SpotifyPlaylistTrackItem).parse(raw);
    for (const item of page.items) {
      if (!item.track) continue;
      if (item.track.is_local) continue;
      if (!item.track.id) continue; // local/unavailable 안전망
      out.push(item.track);
    }
    url = page.next;
  }
  return out;
}
