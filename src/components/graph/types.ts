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
