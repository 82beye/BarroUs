"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    await signOut();
    router.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-[11px] uppercase tracking-[0.12em] text-ink transition-colors hover:text-accent disabled:opacity-60"
    >
      {pending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
