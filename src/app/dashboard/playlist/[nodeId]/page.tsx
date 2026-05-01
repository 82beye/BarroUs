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

  // 본인 소유만 dashboard에서 노출 (남의 플리는 share URL로만 접근)
  if (detail.playlist.createdBy !== session.user.id) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6 md:p-8">
      <Link
        href="/dashboard"
        className="text-sm text-neutral-500 transition hover:text-neutral-300"
      >
        ← 대시보드로
      </Link>
      <PlaylistTracksView
        detail={detail}
        actions={<ShareButton nodeId={detail.playlist.nodeId} />}
      />
    </main>
  );
}
