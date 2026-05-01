import type { GraphEdge, GraphNode } from "@/server/queries/get-my-graph";

export type NodeType = GraphNode["type"];
export type EdgeKind = GraphEdge["kind"];

export const NODE_TYPES: NodeType[] = ["person", "playlist", "track", "text_note"];
export const EDGE_KINDS: EdgeKind[] = ["contains", "authored_by", "mentions"];

export type ForceSettings = {
  /** 중심으로 끌어당기는 힘 (0~1) */
  center: number;
  /** 노드 간 반발력 (0~200) */
  repel: number;
  /** 엣지 인장력 (0~1) */
  linkForce: number;
  /** 엣지 거리 (10~200) */
  linkDistance: number;
};

export type DisplaySettings = {
  showLabels: boolean;
  showArrows: boolean;
  /** degree 기반 노드 크기 가중치 (0~3) */
  sizeByDegree: number;
};

export type FilterSettings = {
  types: Record<NodeType, boolean>;
  kinds: Record<EdgeKind, boolean>;
  hideOrphans: boolean;
  search: string;
};

export const DEFAULT_FORCE: ForceSettings = {
  center: 0.05,
  repel: 80,
  linkForce: 0.4,
  linkDistance: 60,
};

/**
 * 노드 수에 따라 적절한 force preset을 계산.
 * - 적은 그래프(≤30): 모이게, 가깝게
 * - 큰 그래프(300+): 산개시키고 거리 길게 → 겹침 방지
 *
 * 연속 함수로 구현 (계단형 아닌 부드러운 변화).
 */
export function computeAutoForce(nodeCount: number): ForceSettings {
  const n = Math.max(1, nodeCount);
  const clamp = (lo: number, hi: number, v: number) => Math.min(hi, Math.max(lo, v));

  return {
    // 노드 적으면 강한 중심력, 많으면 약하게 풀어줌
    center: clamp(0.02, 0.1, 1 / Math.sqrt(n) / 1.6),
    // 노드 많을수록 강한 반발력 (겹침 방지의 핵심)
    repel: clamp(60, 320, 50 + n * 0.7),
    // 인장력은 노드 수와 무관하게 적당히
    linkForce: clamp(0.25, 0.5, 0.5 - n / 4000),
    // 엣지 길이는 √n 비례로 길어짐
    linkDistance: clamp(40, 140, 35 + Math.sqrt(n) * 5),
  };
}

export const DEFAULT_DISPLAY: DisplaySettings = {
  showLabels: true,
  showArrows: false,
  sizeByDegree: 1.5,
};

export const DEFAULT_FILTER: FilterSettings = {
  types: { person: true, playlist: true, track: true, text_note: true },
  kinds: { contains: true, authored_by: true, mentions: true },
  hideOrphans: false,
  search: "",
};

export const NODE_COLOR: Record<NodeType, string> = {
  person: "#E54A28", // accent
  playlist: "var(--color-ink)",
  track: "var(--color-muted)",
  text_note: "#6B6B66",
};

export const EDGE_COLOR: Record<EdgeKind, string> = {
  contains: "var(--color-line-soft)",
  authored_by: "rgba(229,74,40,0.7)",
  mentions: "var(--color-line-soft)",
};
