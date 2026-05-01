"use client";

import { useState, useTransition } from "react";
import { importLikedSongs } from "@/server/actions/import-liked-songs";

export default function ImportLikedSongsButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const r = await importLikedSongs();
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex items-center gap-2 border border-line bg-ink px-4 py-2.5 text-[12px] uppercase tracking-[0.12em] text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="text-accent">♥</span>
        <span>{pending ? "임포트 중..." : "좋아요 곡 임포트"}</span>
      </button>
      {error ? <p className="text-xs text-accent">{error}</p> : null}
    </div>
  );
}
