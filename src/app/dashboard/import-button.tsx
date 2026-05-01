"use client";

import { useState, useTransition } from "react";
import { importPlaylist } from "@/server/actions/import-playlist";

export default function ImportButton({ playlistId }: { playlistId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
        disabled={pending}
        className="rounded-md bg-[#1db954] px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "임포트 중..." : "Import"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
