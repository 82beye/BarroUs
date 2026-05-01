import "server-only";
import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { edges, nodes } from "@/db/schema";

export type GraphNode = {
  id: string;
  type: "track" | "playlist" | "person" | "text_note";
  title: string;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: "contains" | "authored_by" | "mentions";
};

export type GraphPayload = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  truncated: boolean;
};

const NODE_HARD_CAP = 600;

/**
 * 사용자가 만든 그래프 — 본인이 created_by인 nodes 전부 + 그것과 연결된 edges 전부.
 *
 * D1 단순화:
 * - 트랙은 본인이 만든 것만 (즉 본인이 임포트할 때 새로 INSERT한 트랙)
 * - 다른 사람이 먼저 dedupe로 만들어 둔 트랙은 본인 그래프에서 빠짐 (D2 이후 보강)
 * - HARD_CAP 600 — sigma 부담 회피
 */
export async function getMyGraph(userId: string): Promise<GraphPayload> {
  const ownedNodes = await db
    .select({
      id: nodes.id,
      type: nodes.type,
      title: nodes.title,
    })
    .from(nodes)
    .where(eq(nodes.createdBy, userId))
    .limit(NODE_HARD_CAP + 1);

  const truncated = ownedNodes.length > NODE_HARD_CAP;
  const nodeRows = truncated ? ownedNodes.slice(0, NODE_HARD_CAP) : ownedNodes;
  const nodeIds = nodeRows.map((n) => n.id);

  let edgeRows: { id: string; from: string; to: string; kind: string }[] = [];
  if (nodeIds.length > 0) {
    edgeRows = await db
      .select({
        id: edges.id,
        from: edges.fromNode,
        to: edges.toNode,
        kind: edges.kind,
      })
      .from(edges)
      .where(or(inArray(edges.fromNode, nodeIds), inArray(edges.toNode, nodeIds)));
  }

  const idSet = new Set(nodeIds);
  const filteredEdges = edgeRows.filter((e) => idSet.has(e.from) && idSet.has(e.to));

  return {
    nodes: nodeRows.map((n) => ({
      id: n.id,
      type: n.type as GraphNode["type"],
      title: n.title,
    })),
    edges: filteredEdges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      kind: e.kind as GraphEdge["kind"],
    })),
    truncated,
  };
}
