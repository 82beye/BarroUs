"use client";

import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useEffect, useRef, useState } from "react";
import Sigma from "sigma";
import type { GraphEdge, GraphNode } from "@/server/queries/get-my-graph";

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const NODE_COLOR: Record<GraphNode["type"], string> = {
  person: "#E54A28", // accent
  playlist: "#0E0E0E", // ink (light) — dark에선 토큰이 inverted
  track: "#8A8780", // muted
  text_note: "#6B6B66", // 향후 노트
};

const NODE_SIZE: Record<GraphNode["type"], number> = {
  person: 14,
  playlist: 10,
  track: 4,
  text_note: 8,
};

const EDGE_COLOR: Record<GraphEdge["kind"], string> = {
  contains: "rgba(14,14,14,0.18)",
  authored_by: "#E54A28",
  mentions: "rgba(14,14,14,0.35)",
};

export default function GraphCanvas({ nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (nodes.length === 0) return;

    const graph = new Graph({ multi: false });

    for (const n of nodes) {
      graph.addNode(n.id, {
        label: n.title,
        size: NODE_SIZE[n.type],
        color: NODE_COLOR[n.type],
        nodeType: n.type,
        // 초기 좌표 — random + later forceAtlas2
        x: Math.random(),
        y: Math.random(),
      });
    }

    for (const e of edges) {
      if (!graph.hasNode(e.from) || !graph.hasNode(e.to)) continue;
      // 자기 참조 방지
      if (e.from === e.to) continue;
      const key = `${e.from}->${e.to}->${e.kind}`;
      if (graph.hasEdge(key)) continue;
      graph.addEdgeWithKey(key, e.from, e.to, {
        size: 0.6,
        color: EDGE_COLOR[e.kind],
        kind: e.kind,
      });
    }

    // ForceAtlas2 — 사이드 프로젝트 스케일에서 충분
    forceAtlas2.assign(graph, {
      iterations: nodes.length > 200 ? 200 : 400,
      settings: {
        gravity: 0.6,
        scalingRatio: 8,
        slowDown: 4,
        barnesHutOptimize: nodes.length > 150,
      },
    });

    const sigma = new Sigma(graph, containerRef.current, {
      labelDensity: 0.6,
      labelGridCellSize: 70,
      labelRenderedSizeThreshold: 8,
      defaultEdgeColor: "rgba(14,14,14,0.18)",
      labelColor: { color: "#0E0E0E" },
      labelFont: "Pretendard, sans-serif",
      labelSize: 12,
      labelWeight: "600",
      renderEdgeLabels: false,
    });

    sigmaRef.current = sigma;

    sigma.on("clickNode", ({ node }) => {
      const attr = graph.getNodeAttributes(node);
      setSelected({
        id: node,
        type: attr.nodeType as GraphNode["type"],
        title: attr.label as string,
      });
    });

    sigma.on("clickStage", () => setSelected(null));

    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
  }, [nodes, edges]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* LEGEND */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1 border border-line bg-bg/80 px-3 py-2 text-[10px] uppercase tracking-[0.12em] backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: NODE_COLOR.person }} />
          person
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: NODE_COLOR.playlist }} />
          playlist
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: NODE_COLOR.track }} />
          track
        </div>
      </div>

      {/* SELECTED PANEL */}
      {selected ? (
        <div className="absolute right-3 top-3 max-w-[280px] border border-line bg-bg/90 p-4 backdrop-blur">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted">{selected.type}</div>
          <div className="mt-1 font-serif text-xl font-light italic leading-tight">
            {selected.title}
          </div>
          <div className="mt-2 font-mono text-[10px] text-muted break-all">{selected.id}</div>
          {selected.type === "playlist" ? (
            <a
              href={`/dashboard/playlist/${selected.id}`}
              className="mt-3 inline-flex items-center gap-1 border border-line px-2 py-1 text-[11px] uppercase tracking-[0.12em] hover:bg-ink hover:text-bg"
            >
              열기 <span className="text-accent">→</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
