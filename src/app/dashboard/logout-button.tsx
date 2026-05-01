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
      className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm transition hover:bg-neutral-900 disabled:opacity-60"
    >
      {pending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
