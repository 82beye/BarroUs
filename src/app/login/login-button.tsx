"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export default function LoginButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);
    try {
      await signIn.social({
        provider: "spotify",
        callbackURL: "/dashboard",
      });
    } catch (err) {
      console.error("Spotify sign-in failed", err);
      setError("로그인에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="mt-2 flex items-center justify-between bg-ink px-5 py-4 font-sans text-[15px] font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{pending ? "이동 중..." : "Spotify로 로그인"}</span>
        <span className="text-accent">→</span>
      </button>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
