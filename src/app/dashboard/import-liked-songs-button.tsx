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
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md border border-pink-700 bg-pink-950/40 px-3 py-1.5 text-sm text-pink-200 transition hover:bg-pink-900/40 disabled:opacity-60"
      >
        {pending ? "임포트 중..." : "♥ 좋아요 곡 임포트"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
