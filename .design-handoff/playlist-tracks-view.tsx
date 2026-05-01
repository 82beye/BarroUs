import Image from "next/image";
import PreviewButton from "@/components/preview-button";
import type { PlaylistDetail } from "@/server/queries/get-playlist-detail";

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function totalDuration(tracks: PlaylistDetail["tracks"]): string {
  const totalMs = tracks.reduce((acc, t) => acc + t.durationMs, 0);
  const totalMin = Math.floor(totalMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}H ${m}M` : `${m}M`;
}

type Props = {
  detail: PlaylistDetail;
  /** 우상단에 노출할 액션 (예: Share 버튼) */
  actions?: React.ReactNode;
  /** 큐레이터/이슈 메타바를 노출할지 (Share 페이지 true, dashboard false) */
  showMastMeta?: boolean;
};

export default function PlaylistTracksView({ detail, actions, showMastMeta = true }: Props) {
  const { playlist, tracks } = detail;
  const kind = playlist.isLikedSongs ? "LIKED SONGS" : "PLAYLIST";

  return (
    <div className="flex flex-col">
      {/* META BAR */}
      {showMastMeta ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-2.5 text-[11px] uppercase tracking-[0.14em]">
          <div>
            {kind} <span className="text-accent">●</span> {playlist.ownerDisplayName ?? "익명"}
          </div>
          <div className="font-mono text-muted">
            {tracks.length} TRACKS · {totalDuration(tracks)}
          </div>
        </div>
      ) : null}

      {/* HERO — 거대 디스플레이 타입 */}
      <header className="border-b border-line py-10 md:py-16">
        <div className="mb-3 flex items-baseline justify-between text-[11px] uppercase tracking-[0.14em] text-muted">
          <span>{kind} · CURATED BY {playlist.ownerDisplayName ?? "익명"}</span>
          <span className="font-serif text-2xl italic text-ink not-uppercase tracking-normal">
            № {playlist.nodeId.slice(0, 3).toUpperCase()}
          </span>
        </div>
        <h1 className="display-type text-[clamp(40px,9vw,128px)] text-ink">
          {playlist.title}
        </h1>
        {playlist.description ? (
          <p className="mt-6 max-w-[46ch] font-serif text-lg font-light leading-relaxed text-ink/80 text-pretty">
            {playlist.description}
          </p>
        ) : null}
      </header>

      {/* COVER + ACTIONS */}
      <section className="grid gap-8 border-b border-line py-8 md:grid-cols-[1.1fr_1fr] md:gap-12 md:py-10">
        {/* Cover — 4:5, 사선 패턴 + 이미지 */}
        <div
          className="stripe-cover relative aspect-[4/5] w-full"
          style={{ ["--stripe-angle" as string]: "120deg" }}
        >
          {playlist.imageUrl ? (
            <Image
              src={playlist.imageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover mix-blend-multiply dark:mix-blend-screen"
              unoptimized
            />
          ) : null}
          <div className="absolute left-4 top-4 bg-ink px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-bg">
            COVER · {kind}
          </div>
          <div className="display-type absolute inset-x-6 bottom-20 text-[clamp(28px,4vw,56px)] mix-blend-difference">
            {playlist.title.split(" ").slice(0, 2).join(" ") || playlist.title}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3 border-b border-line-soft pb-3.5 text-[11px] uppercase tracking-[0.14em] text-muted">
            <span>EDITORIAL</span>
            <span>—</span>
            <span className="text-accent">{kind}</span>
            <span>—</span>
            <span>
              {tracks.length} TRACKS · {totalDuration(tracks)}
            </span>
          </div>

          <p className="font-serif text-[18px] font-light leading-[1.55] text-pretty">
            <span className="float-left pr-2 pt-1 text-[3em] font-medium leading-[0.85] text-accent">
              {(playlist.title[0] ?? "♪").trim()}
            </span>
            {playlist.description ??
              "큐레이터가 묶은 한 편의 플리. 곡과 곡 사이의 침묵, 순서가 만드는 문장."}
          </p>

          <div className="mt-auto flex flex-wrap gap-2.5">
            {actions ?? null}
          </div>
        </div>
      </section>

      {/* TRACKLIST */}
      {tracks.length === 0 ? (
        <p className="py-8 text-sm text-muted">트랙이 없는 플리예요.</p>
      ) : (
        <section className="py-6">
          <div className="grid grid-cols-[36px_1fr_56px_36px] items-baseline gap-3.5 border-b border-line pb-2.5 text-[10px] uppercase tracking-[0.14em] text-muted md:grid-cols-[36px_minmax(0,1fr)_60px_50px_36px]">
            <div>#</div>
            <div>TRACK</div>
            <div className="hidden md:block">BPM</div>
            <div>TIME</div>
            <div />
          </div>
          <ol className="flex flex-col">
            {tracks.map((t, i) => (
              <li
                key={t.nodeId}
                className="group grid grid-cols-[36px_1fr_56px_36px] items-baseline gap-3.5 border-b border-line-soft py-3.5 transition-[padding] hover:pl-3 md:grid-cols-[36px_minmax(0,1fr)_60px_50px_36px]"
              >
                <span className="font-mono text-xs text-muted">
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                <div className="min-w-0 flex items-baseline gap-3">
                  {t.albumImageUrl ? (
                    <Image
                      src={t.albumImageUrl}
                      alt=""
                      width={28}
                      height={28}
                      className="self-center"
                      unoptimized
                    />
                  ) : (
                    <div className="size-7 shrink-0 self-center bg-card" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold tracking-[-0.01em] transition-colors group-hover:text-accent md:text-[17px]">
                      {t.title}
                    </p>
                    <p className="truncate text-xs text-muted">{t.artists.join(", ")}</p>
                  </div>
                </div>
                <span className="hidden font-mono text-[11px] tracking-[0.06em] text-muted md:block">
                  {/* BPM은 옵션 — Spotify Audio Features 가져오면 표시 */}
                  —
                </span>
                <span className="font-mono text-xs text-muted">
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
        </section>
      )}
    </div>
  );
}
