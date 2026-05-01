import Image from "next/image";
import { notFound } from "next/navigation";
import PreviewButton from "@/components/preview-button";
import { getShareWithTracks } from "@/server/queries/get-share-with-tracks";

type Params = Promise<{ shareId: string }>;

export const dynamic = "force-dynamic";

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function SharePage({ params }: { params: Params }) {
  const { shareId } = await params;
  const data = await getShareWithTracks(shareId);
  if (!data) notFound();

  const { playlist, tracks } = data;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6 md:p-8">
      <header className="flex items-start gap-4">
        {playlist.imageUrl ? (
          <Image
            src={playlist.imageUrl}
            alt=""
            width={120}
            height={120}
            className="rounded-md"
            unoptimized
          />
        ) : (
          <div className="size-[120px] rounded-md bg-neutral-800" />
        )}
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wider text-neutral-500">PLAYLIST</p>
          <h1 className="text-3xl font-bold tracking-tight">{playlist.title}</h1>
          {playlist.description ? (
            <p className="mt-1 text-sm text-neutral-400">{playlist.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-neutral-500">
            {playlist.ownerDisplayName ?? "익명"} · {tracks.length}곡
          </p>
        </div>
      </header>

      {tracks.length === 0 ? (
        <p className="text-sm text-neutral-500">트랙이 없는 플리예요.</p>
      ) : (
        <ol className="flex flex-col">
          {tracks.map((t, i) => (
            <li
              key={t.nodeId}
              className="flex items-center gap-3 border-b border-neutral-900 py-2 last:border-b-0"
            >
              <span className="w-6 text-right text-xs text-neutral-500">{i + 1}</span>
              {t.albumImageUrl ? (
                <Image
                  src={t.albumImageUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="rounded"
                  unoptimized
                />
              ) : (
                <div className="size-9 rounded bg-neutral-800" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="truncate text-xs text-neutral-400">{t.artists.join(", ")}</p>
              </div>
              <span className="font-mono text-xs text-neutral-500">
                {formatDuration(t.durationMs)}
              </span>
              <PreviewButton
                nodeId={t.nodeId}
                previewUrl={t.previewUrl}
                spotifyUrl={t.spotifyUrl}
              />
            </li>
          ))}
        </ol>
      )}

      <footer className="mt-4 text-center text-xs text-neutral-600">BarroUs — 플리 한 장</footer>
    </main>
  );
}
