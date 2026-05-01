"use client";

import { useState } from "react";
import type { GraphEdge, GraphNode } from "@/server/queries/get-my-graph";
import ForceGraphCanvas from "./force-graph-canvas";
import GraphSettingsPanel from "./graph-settings-panel";
import {
  computeAutoForce,
  DEFAULT_DISPLAY,
  DEFAULT_FILTER,
  type DisplaySettings,
  type FilterSettings,
  type ForceSettings,
} from "./types";
import { useGraphFilters } from "./use-graph-filters";

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export default function GraphView({ nodes, edges }: Props) {
  // 첫 마운트 시 노드 수 기반 자동 preset (이후엔 사용자 슬라이더가 우선)
  const [force, setForce] = useState<ForceSettings>(() => computeAutoForce(nodes.length));
  const [display, setDisplay] = useState<DisplaySettings>(DEFAULT_DISPLAY);
  const [filter, setFilter] = useState<FilterSettings>(DEFAULT_FILTER);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const filtered = useGraphFilters(nodes, edges, filter);

  /** Settings 패널의 "Auto" 버튼 — 현재 가시 노드 수 기준으로 force 재적용 */
  const handleAutoForce = () => {
    setForce(computeAutoForce(filtered.nodes.length));
  };

  return (
    <div className="relative grid h-full w-full grid-cols-[1fr_auto]">
      {/* CANVAS AREA */}
      <div className="relative h-full w-full overflow-hidden">
        <ForceGraphCanvas
          nodes={filtered.nodes}
          edges={filtered.edges}
          matchedIds={filtered.matchedIds}
          degreeById={filtered.degreeById}
          force={force}
          display={display}
          onSelect={setSelected}
        />

        {/* TOGGLE PANEL */}
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="absolute right-3 top-3 border border-line bg-bg/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] backdrop-blur hover:bg-ink hover:text-bg"
        >
          {panelOpen ? "settings →" : "← settings"}
        </button>

        {/* SELECTED NODE PANEL */}
        {selected ? (
          <div className="absolute left-3 top-3 max-w-[300px] border border-line bg-bg/90 p-4 backdrop-blur">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
              {selected.type}
            </div>
            <div className="mt-1 font-serif text-xl font-light italic leading-tight">
              {selected.title}
            </div>
            <div className="mt-2 break-all font-mono text-[10px] text-muted">{selected.id}</div>
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

      {/* SIDEBAR */}
      {panelOpen ? (
        <GraphSettingsPanel
          force={force}
          setForce={setForce}
          onAutoForce={handleAutoForce}
          display={display}
          setDisplay={setDisplay}
          filter={filter}
          setFilter={setFilter}
          stats={{
            totalNodes: nodes.length,
            totalEdges: edges.length,
            visibleNodes: filtered.nodes.length,
            visibleEdges: filtered.edges.length,
          }}
        />
      ) : null}
    </div>
  );
}
