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
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-full bg-[#1db954] px-6 py-3 font-semibold text-black transition hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "이동 중..." : "Continue with Spotify"}
      </button>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
