import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SpotifyAuthExpiredError } from "@/lib/spotify/client";
import { listMyPlaylists } from "@/lib/spotify/playlists";
import { ensurePersonNode } from "@/server/auth/ensure-person-node";
import { listImportedPlaylists } from "@/server/queries/list-imported-playlists";
import { getValidSpotifyToken } from "@/server/spotify/get-access-token";
import ImportButton from "./import-button";
import ImportLikedSongsButton from "./import-liked-songs-button";
import LogoutButton from "./logout-button";
import ShareButton from "./share-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // person node 보장 (그래프 일관성)
  await ensurePersonNode(session.user.id, session.user.name ?? session.user.email);

  // Spotify access token + 플리 목록 조회 (만료 시 재로그인 유도)
  const accessToken = await getValidSpotifyToken(session.user.id);
  if (!accessToken) redirect("/login?reason=expired");

  let spotifyPlaylists: Awaited<ReturnType<typeof listMyPlaylists>> = [];
  let spotifyError: string | null = null;
  try {
    spotifyPlaylists = await listMyPlaylists(accessToken);
  } catch (err) {
    if (err instanceof SpotifyAuthExpiredError) redirect("/login?reason=expired");
    console.error("listMyPlaylists failed", err);
    spotifyError = "Spotify에서 플리를 불러오지 못했어요.";
  }

  const imported = await listImportedPlaylists(session.user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span>{session.user.name ?? session.user.email}</span>
          <LogoutButton />
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-400">좋아요 곡</h2>
          <ImportLikedSongsButton />
        </div>
        <p className="text-xs text-neutral-500">
          Spotify에서 ♥ 누른 곡을 한 묶음으로 가져와요. 다시 임포트하면 새 곡이 추가됩니다.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-400">내 Spotify 플리</h2>
        {spotifyError ? (
          <p className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">{spotifyError}</p>
        ) : spotifyPlaylists.length === 0 ? (
          <p className="text-sm text-neutral-500">플리가 없어요.</p>
        ) : (
          <ul className="grid gap-2">
            {spotifyPlaylists.map((p) => {
              const imageUrl = p.images?.[0]?.url ?? null;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-md"
                      unoptimized
                    />
                  ) : (
                    <div className="size-12 rounded-md bg-neutral-800" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-neutral-500">
                      {p.tracks?.total ?? 0}곡 · {p.owner.display_name ?? p.owner.id}
                    </p>
                  </div>
                  <ImportButton playlistId={p.id} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-400">임포트한 플리</h2>
        {imported.length === 0 ? (
          <p className="text-sm text-neutral-500">아직 임포트한 플리가 없어요.</p>
        ) : (
          <ul className="grid gap-2">
            {imported.map((p) => (
              <li
                key={p.nodeId}
                className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3"
              >
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-md"
                    unoptimized
                  />
                ) : (
                  <div
                    className={`flex size-12 items-center justify-center rounded-md text-lg ${
                      p.isLikedSongs ? "bg-pink-900/40 text-pink-300" : "bg-neutral-800"
                    }`}
                  >
                    {p.isLikedSongs ? "♥" : ""}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {p.title}
                    {p.isLikedSongs ? (
                      <span className="ml-2 text-xs text-pink-300">좋아요 곡</span>
                    ) : null}
                  </p>
                  <p className="font-mono text-xs text-neutral-500">{p.nodeId}</p>
                </div>
                <ShareButton nodeId={p.nodeId} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
