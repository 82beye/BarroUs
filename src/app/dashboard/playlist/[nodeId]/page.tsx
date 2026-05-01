import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ShareButton from "@/app/dashboard/share-button";
import PlaylistTracksView from "@/components/playlist-tracks-view";
import { auth } from "@/lib/auth";
import { getPlaylistDetail } from "@/server/queries/get-playlist-detail";

type Params = Promise<{ nodeId: string }>;

export const dynamic = "force-dynamic";

export default async function DashboardPlaylistPage({ params }: { params: Params }) {
  const { nodeId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const detail = await getPlaylistDetail(nodeId);
  if (!detail) notFound();
  if (detail.playlist.createdBy !== session.user.id) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-5 pb-20 md:px-10">
      {/* MASTHEAD */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-6 border-b border-line pt-6 pb-3.5 md:pt-8">
        <div className="flex gap-4 text-[11px] uppercase tracking-[0.12em]">
          <Link href="/dashboard" className="text-ink hover:text-accent">
            ← 대시보드
          </Link>
        </div>
        <div className="font-serif text-3xl italic leading-none tracking-[-0.02em] md:text-4xl md:text-center">
          <em>Barro</em>
          <b className="not-italic font-sans font-semibold tracking-[-0.04em]">Us</b>
        </div>
        <div className="hidden justify-end text-[11px] uppercase tracking-[0.12em] text-muted md:flex">
          PRIVATE · OWNER
        </div>
      </div>

      <PlaylistTracksView
        detail={detail}
        actions={<ShareButton nodeId={detail.playlist.nodeId} />}
        showMastMeta={false}
      />
    </main>
  );
}
