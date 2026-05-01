import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/dashboard/logout-button";
import GraphCanvas from "@/components/graph-canvas";
import ThemeToggle from "@/components/theme-toggle";
import { auth } from "@/lib/auth";
import { getMyGraph } from "@/server/queries/get-my-graph";

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const graph = await getMyGraph(session.user.id);
  const userName = session.user.name ?? session.user.email;

  const counts = graph.nodes.reduce(
    (acc, n) => {
      acc[n.type] = (acc[n.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-5 pb-10 md:px-10">
      {/* MASTHEAD */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-6 border-b border-line pt-6 pb-3.5 md:pt-8">
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
        <div className="flex justify-end items-baseline gap-3.5 text-[11px] uppercase tracking-[0.12em]">
          <ThemeToggle />
          <span className="text-muted">{userName}</span>
          <LogoutButton />
        </div>
      </div>

      {/* META BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-2.5 text-[11px] uppercase tracking-[0.12em]">
        <div>
          GRAPH <span className="text-accent">●</span> @{userName}
        </div>
        <div className="font-mono text-muted">
          {graph.nodes.length} NODES · {graph.edges.length} EDGES
          {graph.truncated ? " · TRUNCATED" : null}
        </div>
      </div>

      {/* HERO */}
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-line py-8 md:py-10">
        <h1 className="display-type text-[clamp(36px,5.5vw,72px)]">
          내 음악의 <em>지도</em>.
        </h1>
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {(counts.person ?? 0).toString().padStart(2, "0")} PERSON ·{" "}
          {(counts.playlist ?? 0).toString().padStart(2, "0")} PLAYLIST ·{" "}
          {(counts.track ?? 0).toString().padStart(2, "0")} TRACK
        </div>
      </section>

      {/* CANVAS */}
      {graph.nodes.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 border-b border-line">
          <p className="font-serif text-2xl italic font-light">아직 그릴 게 없어요.</p>
          <Link
            href="/dashboard"
            className="border border-line px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] hover:bg-ink hover:text-bg"
          >
            대시보드에서 플리 임포트 →
          </Link>
        </div>
      ) : (
        <div className="relative h-[70vh] min-h-[480px] border-b border-line">
          <GraphCanvas nodes={graph.nodes} edges={graph.edges} />
        </div>
      )}

      {/* FOOTNOTE */}
      <div className="mt-4 font-serif text-sm font-light italic text-muted">
        node를 끌어 옮기거나 휠로 확대/축소해 보세요. 클릭하면 상세가 우측에 뜹니다.
      </div>
    </main>
  );
}
