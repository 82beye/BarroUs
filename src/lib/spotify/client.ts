import "server-only";

export class SpotifyAuthExpiredError extends Error {
  constructor() {
    super("Spotify access token expired or revoked");
    this.name = "SpotifyAuthExpiredError";
  }
}

export class SpotifyApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Spotify API ${status}: ${body.slice(0, 200)}`);
    this.name = "SpotifyApiError";
  }
}

const SPOTIFY_BASE = "https://api.spotify.com/v1";

/**
 * Spotify Web API GET 호출 래퍼.
 * - 401 → SpotifyAuthExpiredError (호출 측에서 /login?reason=expired 리다이렉트)
 * - 그 외 4xx/5xx → SpotifyApiError (호출 측에서 사용자 친화적 메시지로 변환)
 */
export async function spotifyFetch<T>(accessToken: string, path: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${SPOTIFY_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 401) throw new SpotifyAuthExpiredError();
  if (!res.ok) {
    const body = await res.text();
    throw new SpotifyApiError(res.status, body);
  }
  return (await res.json()) as T;
}
