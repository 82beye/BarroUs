// src/app/p/[shareId]/page.tsx

import { notFound } from "next/navigation";
import PlaylistTracksView from "@/components/playlist-tracks-view";
import { getPlaylistDetail, resolveShareNodeId } from "@/server/queries/get-playlist-detail";

type Params = Promise<{ shareId: string }>;

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Params }) {
  const { shareId } = await params;
  const nodeId = await resolveShareNodeId(shareId);
  if (!nodeId) notFound();

  const detail = await getPlaylistDetail(nodeId);
  if (!detail) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-5 pb-20 md:px-10">
      {/* MASTHEAD */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-6 border-b border-line pt-6 pb-3.5 md:pt-8">
        <div className="hidden gap-4 text-[11px] uppercase tracking-[0.12em] md:flex">
          <a href="/" className="text-ink hover:text-accent">소개</a>
          <a href="/login" className="text-ink hover:text-accent">로그인</a>
        </div>
        <div className="font-serif text-3xl italic leading-none tracking-[-0.02em] md:text-4xl md:text-center">
          <em>Barro</em>
          <b className="not-italic font-sans font-semibold tracking-[-0.04em]">Us</b>
        </div>
        <div className="hidden justify-end gap-3.5 text-[11px] uppercase tracking-[0.12em] md:flex">
          <a href="/login" className="text-muted hover:text-accent">내 플리 만들기</a>
        </div>
      </div>

      {/* PLAYLIST */}
      <PlaylistTracksView detail={detail} />

      {/* COLOPHON */}
      <footer className="mt-10 flex flex-wrap items-baseline justify-between gap-4 border-t border-line pt-6">
        <div className="font-serif text-xl font-light italic">
          BarroUs — 매일, 다른{" "}
          <span className="not-italic font-sans font-semibold text-accent">소리</span>를 듣는 일.
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          SHARE ID · {shareId.slice(0, 6)}
        </div>
      </footer>
    </main>
  );
}
