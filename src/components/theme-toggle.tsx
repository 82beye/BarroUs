"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = (localStorage.getItem("barrous-theme") as "light" | "dark" | null) ?? "light";
    document.documentElement.dataset.theme = saved;
    setTheme(saved);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("barrous-theme", next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent"
      aria-label="Toggle theme"
    >
      {theme === "light" ? "DARK" : "LIGHT"}
    </button>
  );
}
