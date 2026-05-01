import Image from "next/image";
import PreviewButton from "@/components/preview-button";
import type { PlaylistDetail } from "@/server/queries/get-playlist-detail";

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  detail: PlaylistDetail;
  /** 우상단에 노출할 액션 (예: Share 버튼) */
  actions?: React.ReactNode;
};

export default function PlaylistTracksView({ detail, actions }: Props) {
  const { playlist, tracks } = detail;

  return (
    <div className="flex flex-col gap-6">
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
          <div
            className={`flex size-[120px] items-center justify-center rounded-md text-4xl ${
              playlist.isLikedSongs ? "bg-pink-900/40 text-pink-300" : "bg-neutral-800"
            }`}
          >
            {playlist.isLikedSongs ? "♥" : "♪"}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            {playlist.isLikedSongs ? "LIKED SONGS" : "PLAYLIST"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{playlist.title}</h1>
          {playlist.description ? (
            <p className="mt-1 text-sm text-neutral-400">{playlist.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-neutral-500">
            {playlist.ownerDisplayName ?? "익명"} · {tracks.length}곡
          </p>
        </div>
        {actions ? <div className="flex shrink-0 flex-col items-end gap-2">{actions}</div> : null}
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
    </div>
  );
}
