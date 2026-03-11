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
  X,
  Menu,
  CalendarDays,
  CalendarRange,
  Settings,
  BarChart3,
  Flame,
  Minus,
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { useJournal } from "@/hooks/use-journal";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Log Trade", href: "/new-trade", icon: PlusCircle },
  { label: "All Trades", href: "/trades", icon: ClipboardList },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Weekly", href: "/weekly", icon: CalendarRange },
  { label: "Settings", href: "/settings", icon: Settings },
];

function StreakPill({ collapsed }: { collapsed: boolean }) {
  const { stats } = useJournal();

  if (!stats.streak || !stats.streakType) {
    if (collapsed) return null;
    return (
      <div className="mx-2.5 mb-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/30 flex items-center gap-2">
        <Minus className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] text-muted-foreground">No streak</span>
      </div>
    );
  }

  const isWin = stats.streakType === "win";

  if (collapsed) {
    return (
      <div className="flex justify-center mb-2">
        <div className={`h-6 w-6 flex items-center justify-center rounded-full ${isWin ? "bg-amber-500/15" : "bg-red-500/10"}`}>
          {isWin ? (
            <Flame className="h-3 w-3 text-amber-400" />
          ) : (
            <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-2.5 mb-2 px-3 py-2 rounded-lg border flex items-center gap-2 ${
      isWin
        ? "bg-amber-500/8 border-amber-500/20"
        : "bg-red-500/8 border-red-500/20"
    }`}>
      {isWin ? (
        <Flame className="h-3 w-3 text-amber-400 shrink-0" />
      ) : (
        <TrendingUp className="h-3 w-3 text-red-400 rotate-180 shrink-0" />
      )}
      <span className="text-[10px] font-medium capitalize">
        <span className={`font-bold ${isWin ? "text-amber-400" : "text-red-400"}`}>{stats.streak}</span>
        {" "}{stats.streakType} streak
      </span>
    </div>
  );
}

function NavLinks({
  collapsed,
  pathname,
  onNav,
}: {
  collapsed: boolean;
  pathname: string;
  onNav?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 p-2.5 flex-1">
      {!collapsed && (
        <p className="px-2 py-1.5 text-[9px] font-semibold tracking-[0.15em] uppercase text-sidebar-foreground/25 mb-1">
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
            onClick={onNav}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150",
              collapsed ? "justify-center py-3 px-0" : "px-3 py-2.5",
              active
                ? "bg-primary/12 text-primary"
                : "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
            )}
            <Icon
              className={cn(
                "h-[17px] w-[17px] shrink-0 transition-colors",
                active
                  ? "text-primary"
                  : "text-sidebar-foreground/35 group-hover:text-sidebar-foreground",
              )}
            />
            {!collapsed && <span>{item.label}</span>}
            
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  collapsed,
  pathname,
  onNav,
  showCollapse,
  onToggleCollapse,
}: {
  collapsed: boolean;
  pathname: string;
  onNav?: () => void;
  showCollapse?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-sidebar-border",
          collapsed ? "justify-center px-0 py-[18px]" : "px-5 py-[18px]",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-bold tracking-wide gradient-text">
              TradeJournal
            </span>
            <span className="text-[9px] text-sidebar-foreground/35 tracking-[0.18em] uppercase mt-0.5">
              NQ Futures
            </span>
          </div>
        )}
      </div>

      <NavLinks collapsed={collapsed} pathname={pathname} onNav={onNav} />

      {/* Streak pill */}
      <StreakPill collapsed={collapsed} />

      {/* Footer */}
      <div className="border-t border-sidebar-border">
        <div className={cn("p-2.5", collapsed && "flex justify-center")}>
          <ThemeToggle collapsed={collapsed} />
        </div>
        <UserMenu collapsed={collapsed} />
      </div>

      {/* Collapse toggle — desktop only */}
      {showCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3 top-[22px] z-10 flex h-6 w-6 items-center justify-center rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground/40 hover:text-primary hover:border-primary/40 transition-colors shadow-lg"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      )}
    </>
  );
}

/** Desktop sidebar */
export function DesktopSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-[60px]" : "w-[220px]",
      )}
    >
      <SidebarContent
        collapsed={collapsed}
        pathname={pathname}
        showCollapse
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
    </aside>
  );
}

/** Mobile drawer sidebar */
export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // Close on route change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    onClose();
  }, [pathname]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl md:hidden animate-in slide-in-from-left duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent collapsed={false} pathname={pathname} onNav={onClose} />
      </aside>
    </>
  );
}

/** Mobile top bar */
export function MobileTopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="flex md:hidden items-center gap-3 border-b border-border/60 bg-card/95 backdrop-blur-sm px-4 py-3 sticky top-0 z-30">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-bold tracking-wide gradient-text">TradeJournal</span>
      </div>
    </header>
  );
}

/** Combined export for layout */
export function Sidebar() {
  return <DesktopSidebar />;
}
