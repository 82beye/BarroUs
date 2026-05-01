import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { edges, nodes } from "@/db/schema";

export type GraphNode = {
  id: string;
  type: "track" | "playlist" | "person" | "text_note" | "artist" | "album" | "year" | "genre";
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

const NODE_HARD_CAP = 1500;
const META_TYPES = ["artist", "album", "year", "genre"] as const;

/**
 * 사용자 그래프:
 * 1. 사용자가 createdBy인 노드 (본인 plays/playlists/tracks/person)
 * 2. + 그 노드와 연결된 edges
 * 3. + edges의 다른 끝이 메타 노드(artist/album/year/genre)면 함께 포함
 *    (메타 노드는 전역 dedupe라 다른 사용자가 먼저 만든 케이스에서도 보여야 함)
 */
export async function getMyGraph(userId: string): Promise<GraphPayload> {
  // 1) owned nodes
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
  const ownedRows = truncated ? ownedNodes.slice(0, NODE_HARD_CAP) : ownedNodes;
  const ownedIds = ownedRows.map((n) => n.id);

  if (ownedIds.length === 0) {
    return { nodes: [], edges: [], truncated };
  }

  // 2) edges where one end is owned
  const edgeRows = await db
    .select({
      id: edges.id,
      from: edges.fromNode,
      to: edges.toNode,
      kind: edges.kind,
    })
    .from(edges)
    .where(or(inArray(edges.fromNode, ownedIds), inArray(edges.toNode, ownedIds)));

  // 3) 다른 끝 노드 ID 모으기 (owned 아닌 것들)
  const ownedSet = new Set(ownedIds);
  const otherEnds = new Set<string>();
  for (const e of edgeRows) {
    if (!ownedSet.has(e.from)) otherEnds.add(e.from);
    if (!ownedSet.has(e.to)) otherEnds.add(e.to);
  }

  // 4) 그 중 메타 노드만 fetch (전역 dedupe로 다른 사용자가 만든 가능성)
  let metaRows: { id: string; type: string; title: string }[] = [];
  if (otherEnds.size > 0) {
    metaRows = await db
      .select({
        id: nodes.id,
        type: nodes.type,
        title: nodes.title,
      })
      .from(nodes)
      .where(
        and(
          inArray(nodes.id, Array.from(otherEnds)),
          inArray(nodes.type, META_TYPES as unknown as string[]),
        ),
      );
  }

  // 5) 최종 노드 + 살아남는 edge 필터링
  const allNodeIds = new Set<string>(ownedIds);
  for (const r of metaRows) allNodeIds.add(r.id);
  const filteredEdges = edgeRows.filter((e) => allNodeIds.has(e.from) && allNodeIds.has(e.to));

  return {
    nodes: [
      ...ownedRows.map((n) => ({
        id: n.id,
        type: n.type as GraphNode["type"],
        title: n.title,
      })),
      ...metaRows.map((n) => ({
        id: n.id,
        type: n.type as GraphNode["type"],
        title: n.title,
      })),
    ],
    edges: filteredEdges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      kind: e.kind as GraphEdge["kind"],
    })),
    truncated,
  };
}
