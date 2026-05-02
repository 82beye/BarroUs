import type { GraphEdge, GraphNode } from "@/server/queries/get-my-graph";

export type NodeType = GraphNode["type"];
export type EdgeKind = GraphEdge["kind"];

export const NODE_TYPES: NodeType[] = [
  "person",
  "playlist",
  "track",
  "text_note",
  "artist",
  "album",
  "year",
  "genre",
];
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
    center: clamp(0.02, 0.12, 1 / Math.sqrt(n) / 1.4),
    // 노드 많을수록 강한 반발력 (겹침 방지의 핵심)
    repel: clamp(80, 420, 80 + n * 1.0),
    // 인장력 — 노드 많으면 약화해 산개 허용
    linkForce: clamp(0.2, 0.5, 0.5 - n / 3500),
    // 엣지 길이는 √n 비례로 길어짐
    linkDistance: clamp(50, 180, 45 + Math.sqrt(n) * 6),
  };
}

export const DEFAULT_DISPLAY: DisplaySettings = {
  showLabels: true,
  showArrows: false,
  sizeByDegree: 1.5,
};

export const DEFAULT_FILTER: FilterSettings = {
  types: {
    person: true,
    playlist: true,
    track: true,
    text_note: true,
    artist: true,
    album: true,
    year: true,
    genre: true,
  },
  kinds: { contains: true, authored_by: true, mentions: true },
  hideOrphans: false,
  search: "",
};

export const NODE_COLOR: Record<NodeType, string> = {
  person: "#E54A28", // accent (orange)
  playlist: "var(--color-ink)",
  track: "var(--color-muted)",
  text_note: "#6B6B66",
  artist: "#7B61FF", // 진한 보라 — 사람 의미
  album: "#C68A4A", // 따뜻한 갈색
  year: "#4A8FB4", // 시간 축 — 차분한 청
  genre: "#3F8E5C", // 분류/카테고리 — 녹
};

export const EDGE_COLOR: Record<EdgeKind, string> = {
  contains: "var(--color-line-soft)",
  authored_by: "rgba(229,74,40,0.7)",
  mentions: "var(--color-line-soft)",
};
