import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/dashboard/logout-button";
import GraphView from "@/components/graph/graph-view";
import ThemeToggle from "@/components/theme-toggle";
import { auth } from "@/lib/auth";
import { getMyGraph } from "@/server/queries/get-my-graph";

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const graph = await getMyGraph(session.user.id);
  const userName = session.user.name ?? session.user.email;

  return (
    // viewport 전체를 차지 + 자식이 절대 넘치지 않게
    <main className="flex h-screen flex-col overflow-hidden">
      {/* MASTHEAD */}
      <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-end gap-6 border-b border-line px-5 pt-6 pb-3.5 md:px-10 md:pt-8">
        <div className="flex gap-4 text-[11px] uppercase tracking-[0.12em]">
          <Link href="/dashboard" className="text-muted hover:text-accent">
            대시보드
          </Link>
          <span className="text-ink">그래프</span>
        </div>
        <div className="font-serif text-3xl italic leading-none tracking-[-0.02em] md:text-4xl md:text-center">
          <em>Barro</em>
          <b className="not-italic font-sans font-semibold tracking-[-0.04em]">Us</b>
        </div>
        <div className="flex items-baseline justify-end gap-3.5 text-[11px] uppercase tracking-[0.12em]">
          <ThemeToggle />
          <span className="text-muted">{userName}</span>
          <LogoutButton />
        </div>
      </div>

      {/* META BAR */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-2.5 text-[11px] uppercase tracking-[0.12em] md:px-10">
        <div>
          GRAPH <span className="text-accent">●</span> @{userName}
        </div>
        <div className="font-mono text-muted">
          {graph.nodes.length} NODES · {graph.edges.length} EDGES
          {graph.truncated ? " · TRUNCATED" : null}
        </div>
      </div>

      {/* CANVAS — 메뉴 영역 제외한 화면 전체 차지 */}
      {graph.nodes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
          <p className="font-serif text-3xl font-light italic">아직 그릴 게 없어요.</p>
          <p className="max-w-[40ch] text-sm text-muted">
            대시보드에서 좋아요 곡 또는 플리를 임포트하면, 그 노드들이 여기서 한 장의 지도처럼
            떠오릅니다.
          </p>
          <Link
            href="/dashboard"
            className="mt-2 inline-flex items-center gap-2 border border-line px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] hover:bg-ink hover:text-bg"
          >
            대시보드로 <span className="text-accent">→</span>
          </Link>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1">
          <GraphView nodes={graph.nodes} edges={graph.edges} />
        </div>
      )}
    </main>
  );
}
