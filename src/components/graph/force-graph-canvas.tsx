"use client";

import { type ForceLink, forceCenter, forceCollide, forceManyBody } from "d3-force";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphNode } from "@/server/queries/get-my-graph";
import {
  type DisplaySettings,
  EDGE_COLOR,
  type ForceSettings,
  NODE_COLOR,
  type NodeType,
} from "./types";

// react-force-graph-2d는 window 의존 → SSR 비활성화
const ForceGraph2D = dynamic(() => import("react-force-graph-2d").then((m) => m.default), {
  ssr: false,
});

type FGNode = {
  id: string;
  type: NodeType;
  title: string;
  degree: number;
  // d3-force가 직접 채우는 시뮬레이션 좌표
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
};

type FGLink = {
  source: string | FGNode;
  target: string | FGNode;
  kind: GraphEdge["kind"];
};

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  matchedIds: Set<string> | null;
  degreeById: Map<string, number>;
  force: ForceSettings;
  display: DisplaySettings;
  onSelect: (node: GraphNode | null) => void;
};

// CSS var → 실제 색 (canvas는 var() 직접 안 받음). 런타임에 computed 값 가져오기.
function readCssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function resolveNodeColor(type: NodeType): string {
  const raw = NODE_COLOR[type];
  if (raw.startsWith("var(")) {
    const name = raw.slice(4, -1);
    return readCssVar(name, "#0E0E0E");
  }
  return raw;
}

function resolveEdgeColor(kind: GraphEdge["kind"]): string {
  const raw = EDGE_COLOR[kind];
  if (raw.startsWith("var(")) {
    const name = raw.slice(4, -1);
    return readCssVar(name, "rgba(14,14,14,0.18)");
  }
  return raw;
}

export default function ForceGraphCanvas({
  nodes,
  edges,
  matchedIds,
  degreeById,
  force,
  display,
  onSelect,
}: Props) {
  // graph 데이터를 react-force-graph 형태로 변환 (참조 안정성 유지 위해 useMemo)
  const data = useMemo(() => {
    const fgNodes: FGNode[] = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      degree: degreeById.get(n.id) ?? 0,
    }));
    const fgLinks: FGLink[] = edges.map((e) => ({
      source: e.from,
      target: e.to,
      kind: e.kind,
    }));
    return { nodes: fgNodes, links: fgLinks };
  }, [nodes, edges, degreeById]);

  // 호버 → 1차 이웃 highlight
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const neighborhood = useMemo(() => {
    if (!hoveredId) return null;
    const ns = new Set<string>([hoveredId]);
    const ls = new Set<string>();
    for (const e of edges) {
      if (e.from === hoveredId) {
        ns.add(e.to);
        ls.add(e.id);
      } else if (e.to === hoveredId) {
        ns.add(e.from);
        ls.add(e.id);
      }
    }
    return { nodes: ns, edges: ls };
  }, [hoveredId, edges]);

  // edge → original id 빠른 lookup (highlight 비교용)
  const edgeIdMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of edges) {
      m.set(`${e.from}->${e.to}`, e.id);
    }
    return m;
  }, [edges]);

  // 컨테이너 크기
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ForceGraph 인스턴스 ref → forces 직접 조정
  // biome-ignore lint/suspicious/noExplicitAny: 라이브러리 타입이 정의 안 된 메서드 사용
  const fgRef = useRef<any>(null);

  // forces 적용 — collide는 노드 크기에 비례 (겹침 방지의 핵심)
  // 노드 시각 반지름 = sqrt(val) * nodeRelSize (nodeRelSize=4)
  const sizeByDegree = display.sizeByDegree;
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("center", forceCenter(0, 0).strength(force.center));
    fg.d3Force("charge", forceManyBody().strength(-force.repel));
    fg.d3Force(
      "collide",
      forceCollide<FGNode>((d) => Math.sqrt(1 + (d.degree ?? 0) * sizeByDegree) * 4 + 2).strength(
        0.9,
      ),
    );
    const linkForce = fg.d3Force("link") as ForceLink<FGNode, FGLink> | undefined;
    if (linkForce) {
      linkForce.distance(force.linkDistance).strength(force.linkForce);
    }
    fg.d3ReheatSimulation();
  }, [force, sizeByDegree]);

  // 라벨 색 (다크 모드 대응)
  const [labelColor, setLabelColor] = useState("#0E0E0E");
  const [bgColor, setBgColor] = useState("#F2EFE7");
  useEffect(() => {
    const update = () => {
      setLabelColor(readCssVar("--color-ink", "#0E0E0E"));
      setBgColor(readCssVar("--color-bg", "#F2EFE7"));
    };
    update();
    // theme toggle 감지
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  // dynamic import + react-force-graph 타입 generic이 약해 콜백 내부에서 cast.
  const asNode = (o: unknown) => o as FGNode;
  const asLink = (o: unknown) => o as FGLink;

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.w > 0 && size.h > 0 ? (
        <ForceGraph2D
          ref={fgRef}
          width={size.w}
          height={size.h}
          graphData={data}
          backgroundColor={bgColor}
          // 노드
          nodeRelSize={4}
          nodeVal={(o) => {
            const n = asNode(o);
            return 1 + (n.degree ?? 0) * display.sizeByDegree;
          }}
          nodeColor={(o) => {
            const n = asNode(o);
            const base = resolveNodeColor(n.type);
            if (matchedIds && !matchedIds.has(n.id)) return fadeColor(base, 0.15);
            if (neighborhood && !neighborhood.nodes.has(n.id)) return fadeColor(base, 0.18);
            return base;
          }}
          nodeLabel={(o) => {
            const n = asNode(o);
            return `${n.title} · ${n.type}`;
          }}
          nodeCanvasObjectMode={() => (display.showLabels ? "after" : undefined)}
          nodeCanvasObject={(o, ctx, scale) => {
            if (!display.showLabels) return;
            const n = asNode(o);
            if (scale < 1.2 && (n.degree ?? 0) < 2) return;
            const x = n.x ?? 0;
            const y = n.y ?? 0;
            const radius = Math.max(2, Math.sqrt(1 + (n.degree ?? 0) * display.sizeByDegree) * 4);
            const fontSize = Math.max(10, 12 / Math.max(1, scale * 0.9));
            ctx.font = `600 ${fontSize}px Pretendard, sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            const dim = neighborhood && !neighborhood.nodes.has(n.id);
            const unmatched = matchedIds && !matchedIds.has(n.id);
            ctx.fillStyle = dim || unmatched ? fadeColor(labelColor, 0.35) : labelColor;
            ctx.fillText(n.title, x + radius + 3, y);
          }}
          // 엣지
          linkColor={(o) => {
            const l = asLink(o);
            const sId = typeof l.source === "string" ? l.source : l.source.id;
            const tId = typeof l.target === "string" ? l.target : l.target.id;
            const eid = edgeIdMap.get(`${sId}->${tId}`);
            const base = resolveEdgeColor(l.kind);
            if (neighborhood && eid && !neighborhood.edges.has(eid)) return fadeColor(base, 0.25);
            return base;
          }}
          linkWidth={(o) => {
            const l = asLink(o);
            const sId = typeof l.source === "string" ? l.source : l.source.id;
            const tId = typeof l.target === "string" ? l.target : l.target.id;
            const eid = edgeIdMap.get(`${sId}->${tId}`);
            return neighborhood && eid && neighborhood.edges.has(eid) ? 2 : 0.6;
          }}
          linkDirectionalArrowLength={display.showArrows ? 4 : 0}
          linkDirectionalArrowRelPos={1}
          // 인터랙션 — 노드 많을수록 천천히 안정화 (겹침 풀릴 시간 확보)
          cooldownTicks={Number.POSITIVE_INFINITY}
          d3AlphaDecay={Math.max(0.005, 0.028 - nodes.length / 40000)}
          d3VelocityDecay={0.35}
          enableNodeDrag={true}
          onNodeHover={(o) => {
            const n = o ? asNode(o) : null;
            setHoveredId(n?.id ?? null);
            if (containerRef.current) {
              containerRef.current.style.cursor = n ? "pointer" : "grab";
            }
          }}
          onNodeClick={(o) => {
            const n = asNode(o);
            onSelect({ id: n.id, type: n.type, title: n.title });
          }}
          onBackgroundClick={() => onSelect(null)}
          onNodeDragEnd={(o) => {
            const n = asNode(o);
            n.fx = n.x;
            n.fy = n.y;
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * 색상에 alpha 적용 (CSS color → rgba). hex/rgb/rgba 입력 모두 처리.
 */
function fadeColor(color: string, alpha: number): string {
  if (color.startsWith("rgba(")) {
    return color.replace(/rgba\(([^)]+)\)/, (_, inner) => {
      const parts = inner.split(",").map((p: string) => p.trim());
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    });
  }
  if (color.startsWith("rgb(")) {
    return color.replace(/rgb\(([^)]+)\)/, (_, inner) => `rgba(${inner}, ${alpha})`);
  }
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const r = Number.parseInt(full.slice(0, 2), 16);
    const g = Number.parseInt(full.slice(2, 4), 16);
    const b = Number.parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
