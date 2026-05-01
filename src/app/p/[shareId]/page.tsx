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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6 md:p-8">
      <PlaylistTracksView detail={detail} />
      <footer className="mt-4 text-center text-xs text-neutral-600">BarroUs — 플리 한 장</footer>
    </main>
  );
}
