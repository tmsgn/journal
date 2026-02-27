"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Log Trade", href: "/new-trade", icon: PlusCircle },
  { label: "All Trades", href: "/trades", icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-[60px]" : "w-[220px]",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-sidebar-border",
          collapsed ? "justify-center px-0 py-[18px]" : "px-5 py-[18px]",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-bold text-sidebar-foreground tracking-wider">
              iFVG
            </span>
            <span className="text-[10px] text-sidebar-foreground/40 tracking-[0.2em] uppercase mt-0.5">
              Journal
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-2.5 flex-1">
        {/* Section label */}
        {!collapsed && (
          <p className="px-2 py-1.5 text-[9px] font-semibold tracking-[0.15em] uppercase text-sidebar-foreground/30">
            Navigation
          </p>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150",
                collapsed ? "justify-center py-3 px-0" : "px-3 py-2.5",
                active
                  ? "bg-primary/20 text-primary"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              {/* Active bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
              )}
              <Icon
                className={cn(
                  "h-[17px] w-[17px] shrink-0 transition-colors",
                  active
                    ? "text-primary"
                    : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground",
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer section */}
      <div className="border-t border-sidebar-border">
        <div className={cn("p-2.5", collapsed && "flex justify-center")}>
          <ThemeToggle collapsed={collapsed} />
        </div>
        <UserMenu collapsed={collapsed} />
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-[22px] z-10 flex h-6 w-6 items-center justify-center rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground/50 hover:text-primary hover:border-primary/50 transition-colors shadow-lg"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
