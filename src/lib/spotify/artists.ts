import "server-only";
import { z } from "zod";
import { spotifyFetch } from "./client";

const SpotifyArtistDetail = z
  .object({
    id: z.string(),
    name: z.string(),
    genres: z.array(z.string()).nullish(),
    images: z.array(z.object({ url: z.string() })).nullish(),
  })
  .passthrough();

const SeveralArtists = z.object({
  artists: z.array(SpotifyArtistDetail.nullable()),
});

export type SpotifyArtistDetail = z.infer<typeof SpotifyArtistDetail>;

/**
 * Spotify `/v1/artists` 배치 호출 — 한 번에 최대 50개 ID.
 * 임포트 시 트랙들의 모든 artist를 한 번에 fetch해 genres를 채움.
 */
export async function getArtistsByIds(
  accessToken: string,
  ids: string[],
): Promise<Map<string, SpotifyArtistDetail>> {
  const out = new Map<string, SpotifyArtistDetail>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return out;

  const BATCH = 50;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const raw = await spotifyFetch<unknown>(
      accessToken,
      `/artists?ids=${encodeURIComponent(batch.join(","))}`,
    );
    const parsed = SeveralArtists.safeParse(raw);
    if (!parsed.success) {
      console.error("[Spotify /artists] parse failed", parsed.error.issues.slice(0, 3));
      continue;
    }
    for (const a of parsed.data.artists) {
      if (a) out.set(a.id, a);
    }
  }
  return out;
}
