"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light" : "Switch to dark"}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200",
        "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
        collapsed && "justify-center",
      )}
    >
      <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        <Sun
          className={cn(
            "absolute h-3.5 w-3.5 transition-all duration-300",
            isDark
              ? "scale-100 opacity-100 rotate-0"
              : "scale-0 opacity-0 rotate-90",
          )}
        />
        <Moon
          className={cn(
            "absolute h-3.5 w-3.5 transition-all duration-300",
            isDark
              ? "scale-0 opacity-0 -rotate-90"
              : "scale-100 opacity-100 rotate-0",
          )}
        />
      </div>
      {!collapsed && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
