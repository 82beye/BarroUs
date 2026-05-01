"use client";

import { useState, useTransition } from "react";
import { importPlaylist } from "@/server/actions/import-playlist";

type Props = { playlistId: string; trackTotal: number };

export default function ImportButton({ playlistId, trackTotal }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEmpty = trackTotal === 0;

  const handleClick = () => {
    setError(null);
    const fd = new FormData();
    fd.set("playlistId", playlistId);
    startTransition(async () => {
      const r = await importPlaylist(fd);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || isEmpty}
        title={isEmpty ? "빈 플리는 임포트할 수 없어요" : undefined}
        className="border border-line px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "임포트 중..." : isEmpty ? "빈 플리" : "Import →"}
      </button>
      {error ? <p className="text-xs text-accent">{error}</p> : null}
    </div>
  );
}
