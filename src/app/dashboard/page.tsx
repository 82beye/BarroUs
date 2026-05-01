import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
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

  await ensurePersonNode(session.user.id, session.user.name ?? session.user.email);

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
  const userName = session.user.name ?? session.user.email;

  // 매거진 그리드 리듬: 6/3/3, 4/4/4, …
  const rhythm = [
    "md:col-span-6",
    "md:col-span-3",
    "md:col-span-3",
    "md:col-span-4",
    "md:col-span-4",
    "md:col-span-4",
  ] as const;

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-5 pb-16 md:px-10">
      {/* MASTHEAD */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-6 border-b border-line pt-6 pb-3.5 md:pt-8">
        <div className="flex gap-4 text-[11px] uppercase tracking-[0.12em]">
          <span className="text-ink">대시보드</span>
          <Link href="/graph" className="text-muted hover:text-accent">
            그래프
          </Link>
        </div>
        <div className="font-serif text-3xl italic leading-none tracking-[-0.02em] md:text-4xl md:text-center">
          <em>Barro</em>
          <b className="not-italic font-sans font-semibold tracking-[-0.04em]">Us</b>
        </div>
        <div className="flex justify-end items-baseline gap-3.5 text-[11px] uppercase tracking-[0.12em]">
          <ThemeToggle />
          <span className="text-muted">{userName}</span>
          <LogoutButton />
        </div>
      </div>

      {/* META BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-2.5 text-[11px] uppercase tracking-[0.12em]">
        <div>
          WORKSPACE <span className="text-accent">●</span> @{userName}
        </div>
        <div className="font-mono text-muted">
          {imported.length} IMPORTED · {spotifyPlaylists.length} ON SPOTIFY
        </div>
      </div>

      {/* SMALL HERO */}
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-line py-10 md:py-14">
        <h1 className="display-type text-[clamp(36px,5.5vw,80px)]">
          <em>{userName}</em>님의 <span className="text-accent">서가</span>.
        </h1>
        <div className="flex gap-2.5">
          <ImportLikedSongsButton />
        </div>
      </section>

      {/* SECTION i — Spotify source list */}
      <div className="grid grid-cols-[auto_1fr_auto] items-end gap-6 pb-4 pt-10">
        <div className="font-serif text-4xl font-light italic leading-none">i.</div>
        <h2 className="display-type text-2xl">내 Spotify 플리</h2>
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted">SOURCE</div>
      </div>

      {spotifyError ? (
        <p className="border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          {spotifyError}
        </p>
      ) : spotifyPlaylists.length === 0 ? (
        <p className="border-t border-line py-6 text-sm text-muted">플리가 없어요.</p>
      ) : (
        <ul className="border-t border-line">
          {spotifyPlaylists.map((p) => {
            const imageUrl = p.images?.[0]?.url ?? null;
            return (
              <li
                key={p.id}
                className="grid grid-cols-[40px_1fr_auto] items-center gap-4 border-b border-line-soft py-3.5"
              >
                {imageUrl ? (
                  <Image src={imageUrl} alt="" width={40} height={40} unoptimized />
                ) : (
                  <div className="size-10 bg-card" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{p.name}</p>
                  <p className="font-mono text-[11px] text-muted">
                    {p.tracks?.total ?? 0} TRACKS · {p.owner.display_name ?? p.owner.id}
                  </p>
                </div>
                <ImportButton playlistId={p.id} trackTotal={p.tracks?.total ?? 0} />
              </li>
            );
          })}
        </ul>
      )}

      {/* SECTION ii — Imported as MAGAZINE GRID */}
      <div className="grid grid-cols-[auto_1fr_auto] items-end gap-6 pb-4 pt-14">
        <div className="font-serif text-4xl font-light italic leading-none">ii.</div>
        <h2 className="display-type text-2xl">임포트한 플리</h2>
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted">
          {imported.length} ITEMS
        </div>
      </div>

      {imported.length === 0 ? (
        <p className="border-t border-line py-6 text-sm text-muted">아직 임포트한 플리가 없어요.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-5 border-t border-line pt-5 md:grid-cols-12">
          {imported.map((p, i) => {
            const colSpan = rhythm[i % rhythm.length];
            const angle = 30 + ((i * 35) % 150);
            return (
              <li key={p.nodeId} className={`col-span-1 ${colSpan}`}>
                <Link href={`/dashboard/playlist/${p.nodeId}`} className="group block">
                  <div
                    className="stripe-cover relative aspect-square w-full"
                    style={{ ["--stripe-angle" as string]: `${angle}deg` }}
                  >
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover mix-blend-multiply transition-transform duration-500 group-hover:-translate-y-1 dark:mix-blend-screen"
                        unoptimized
                      />
                    ) : null}
                    <div
                      className={`absolute left-3 top-2.5 font-mono text-[10px] ${
                        p.isLikedSongs ? "text-accent" : "text-muted"
                      }`}
                    >
                      {p.isLikedSongs ? "♥" : `P—${(i + 1).toString().padStart(2, "0")}`}
                    </div>
                    <div className="absolute right-3 top-2.5 font-mono text-[10px] text-muted">
                      {p.trackCount}
                    </div>
                    <div className="display-type absolute inset-x-3.5 bottom-3.5 text-[clamp(20px,2.5vw,40px)] mix-blend-difference">
                      {p.title.split(" ")[0]}
                    </div>
                  </div>
                </Link>
                <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-t border-line pt-2">
                  <h4 className="truncate text-sm font-bold tracking-[-0.02em]">
                    {p.title}
                    {p.isLikedSongs ? (
                      <span className="ml-2 font-normal text-accent">좋아요 곡</span>
                    ) : null}
                  </h4>
                  <ShareButton nodeId={p.nodeId} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
