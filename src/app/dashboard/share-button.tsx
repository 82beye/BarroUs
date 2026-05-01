"use client";

import { useState, useTransition } from "react";
import { createShare } from "@/server/actions/create-share";

export default function ShareButton({ nodeId }: { nodeId: string }) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const handleClick = () => {
    setToast(null);
    const fd = new FormData();
    fd.set("nodeId", nodeId);
    startTransition(async () => {
      const r = await createShare(fd);
      if (!r.ok) {
        setToast(r.error);
        return;
      }
      try {
        await navigator.clipboard.writeText(r.url);
        setToast(`복사됨: ${r.url}`);
      } catch {
        setToast(r.url);
      }
      setTimeout(() => setToast(null), 4000);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="border border-line px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-bg disabled:opacity-50"
      >
        {pending ? "..." : "Share"}
      </button>
      {toast ? (
        <p className="max-w-xs truncate text-[11px] text-muted" title={toast}>
          {toast}
        </p>
      ) : null}
    </div>
  );
}
