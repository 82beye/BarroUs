// src/app/login/login-button.tsx
// 기존 login-button.tsx의 onClick / signIn 호출 로직은 유지하고,
// 버튼 마크업만 매거진 톤으로 교체하세요.

"use client";

import { authClient } from "@/lib/auth-client";

export default function LoginButton() {
  const handleClick = async () => {
    await authClient.signIn.social({
      provider: "spotify",
      callbackURL: "/dashboard",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-2 flex items-center justify-between bg-ink px-5 py-4 font-sans text-[15px] font-semibold text-bg transition-opacity hover:opacity-90"
    >
      <span>Spotify로 로그인</span>
      <span className="text-accent">→</span>
    </button>
  );
}
