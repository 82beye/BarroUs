"use client";

import {
  type DisplaySettings,
  EDGE_KINDS,
  type EdgeKind,
  type FilterSettings,
  type ForceSettings,
  NODE_TYPES,
  type NodeType,
} from "./types";

type Props = {
  force: ForceSettings;
  setForce: (next: ForceSettings) => void;
  display: DisplaySettings;
  setDisplay: (next: DisplaySettings) => void;
  filter: FilterSettings;
  setFilter: (next: FilterSettings) => void;
  /** 통계 */
  stats: {
    totalNodes: number;
    totalEdges: number;
    visibleNodes: number;
    visibleEdges: number;
  };
};

const NODE_TYPE_LABEL: Record<NodeType, string> = {
  person: "person",
  playlist: "playlist",
  track: "track",
  text_note: "note",
};

const EDGE_KIND_LABEL: Record<EdgeKind, string> = {
  contains: "contains",
  authored_by: "authored by",
  mentions: "mentions",
};

export default function GraphSettingsPanel({
  force,
  setForce,
  display,
  setDisplay,
  filter,
  setFilter,
  stats,
}: Props) {
  return (
    <aside className="flex h-full w-full max-w-[320px] flex-col gap-6 overflow-y-auto border-l border-line bg-paper p-5 text-[13px]">
      {/* HEAD */}
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <h3 className="text-[11px] uppercase tracking-[0.14em]">Settings</h3>
        <span className="font-mono text-[10px] text-muted">
          {stats.visibleNodes}/{stats.totalNodes} N · {stats.visibleEdges}/{stats.totalEdges} E
        </span>
      </div>

      {/* SEARCH */}
      <Section title="Search">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          placeholder="라벨 검색"
          className="w-full border border-line bg-bg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent"
        />
      </Section>

      {/* FILTERS */}
      <Section title="Filters · type">
        <div className="grid grid-cols-2 gap-2">
          {NODE_TYPES.map((t) => (
            <CheckboxRow
              key={t}
              label={NODE_TYPE_LABEL[t]}
              checked={filter.types[t]}
              onChange={(v) =>
                setFilter({
                  ...filter,
                  types: { ...filter.types, [t]: v },
                })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Filters · edge">
        <div className="flex flex-col gap-1.5">
          {EDGE_KINDS.map((k) => (
            <CheckboxRow
              key={k}
              label={EDGE_KIND_LABEL[k]}
              checked={filter.kinds[k]}
              onChange={(v) =>
                setFilter({
                  ...filter,
                  kinds: { ...filter.kinds, [k]: v },
                })
              }
            />
          ))}
          <div className="mt-1 border-t border-line-soft pt-2">
            <CheckboxRow
              label="hide orphans"
              checked={filter.hideOrphans}
              onChange={(v) => setFilter({ ...filter, hideOrphans: v })}
            />
          </div>
        </div>
      </Section>

      {/* FORCES */}
      <Section title="Forces">
        <SliderRow
          label="center"
          min={0}
          max={1}
          step={0.01}
          value={force.center}
          onChange={(v) => setForce({ ...force, center: v })}
        />
        <SliderRow
          label="repel"
          min={0}
          max={300}
          step={5}
          value={force.repel}
          onChange={(v) => setForce({ ...force, repel: v })}
        />
        <SliderRow
          label="link force"
          min={0}
          max={1}
          step={0.02}
          value={force.linkForce}
          onChange={(v) => setForce({ ...force, linkForce: v })}
        />
        <SliderRow
          label="link distance"
          min={10}
          max={250}
          step={5}
          value={force.linkDistance}
          onChange={(v) => setForce({ ...force, linkDistance: v })}
        />
      </Section>

      {/* DISPLAY */}
      <Section title="Display">
        <CheckboxRow
          label="라벨"
          checked={display.showLabels}
          onChange={(v) => setDisplay({ ...display, showLabels: v })}
        />
        <CheckboxRow
          label="화살표"
          checked={display.showArrows}
          onChange={(v) => setDisplay({ ...display, showArrows: v })}
        />
        <SliderRow
          label="degree 가중치"
          min={0}
          max={3}
          step={0.1}
          value={display.sizeByDegree}
          onChange={(v) => setDisplay({ ...display, sizeByDegree: v })}
        />
      </Section>

      {/* LEGEND */}
      <Section title="Legend">
        <div className="grid gap-1.5 text-[12px]">
          <LegendRow color="#E54A28" label="person" />
          <LegendRow color="var(--color-ink)" label="playlist" />
          <LegendRow color="var(--color-muted)" label="track" />
          <LegendRow color="rgba(229,74,40,0.7)" label="authored_by" line />
          <LegendRow color="var(--color-line-soft)" label="contains / mentions" line />
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-[12px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 cursor-pointer accent-accent"
      />
      <span>{label}</span>
    </label>
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-[11px]">
        <span>{label}</span>
        <span className="font-mono text-muted">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}

function LegendRow({
  color,
  label,
  line = false,
}: {
  color: string;
  label: string;
  line?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {line ? (
        <span className="block h-[2px] w-5" style={{ background: color }} />
      ) : (
        <span className="block size-2.5 rounded-full" style={{ background: color }} />
      )}
      <span>{label}</span>
    </div>
  );
}
