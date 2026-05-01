"use client";

import { useMemo } from "react";
import type { GraphEdge, GraphNode } from "@/server/queries/get-my-graph";
import type { FilterSettings } from "./types";

export type FilterResult = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** 검색어가 있을 때 매치된 노드 id 집합 (없으면 null) */
  matchedIds: Set<string> | null;
  /** 노드 id → degree (필터 후) */
  degreeById: Map<string, number>;
};

/**
 * 필터 파이프라인:
 * 1) edge kind 필터
 * 2) node type 필터
 * 3) orphans 필터 (hideOrphans=true → 연결 없는 노드 제거)
 * 4) edge: 양 끝 노드 모두 살아있어야 살아남음
 * 5) search: 매치 노드 id 집합을 별도 반환 (시각 처리는 캔버스에서)
 */
export function useGraphFilters(
  rawNodes: GraphNode[],
  rawEdges: GraphEdge[],
  filter: FilterSettings,
): FilterResult {
  return useMemo(() => {
    // 1) edge kind 필터
    const passKindEdges = rawEdges.filter((e) => filter.kinds[e.kind]);

    // 2) node type 필터
    let nodes = rawNodes.filter((n) => filter.types[n.type]);
    const liveIds = new Set(nodes.map((n) => n.id));

    // 3) edge: 양 끝 살아있는 것만
    let edges = passKindEdges.filter((e) => liveIds.has(e.from) && liveIds.has(e.to));

    // 4) orphans 처리
    if (filter.hideOrphans) {
      const connected = new Set<string>();
      for (const e of edges) {
        connected.add(e.from);
        connected.add(e.to);
      }
      nodes = nodes.filter((n) => connected.has(n.id));
      const finalIds = new Set(nodes.map((n) => n.id));
      edges = edges.filter((e) => finalIds.has(e.from) && finalIds.has(e.to));
    }

    // 5) degree 계산
    const degreeById = new Map<string, number>();
    for (const e of edges) {
      degreeById.set(e.from, (degreeById.get(e.from) ?? 0) + 1);
      degreeById.set(e.to, (degreeById.get(e.to) ?? 0) + 1);
    }

    // 6) search (대소문자 무시 + trim)
    const q = filter.search.trim().toLowerCase();
    const matchedIds = q
      ? new Set(nodes.filter((n) => n.title.toLowerCase().includes(q)).map((n) => n.id))
      : null;

    return { nodes, edges, matchedIds, degreeById };
  }, [rawNodes, rawEdges, filter]);
}
