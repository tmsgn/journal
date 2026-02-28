"use client";

import { useState } from "react";
import { Sidebar, MobileSidebar, MobileTopBar } from "@/components/sidebar";
import { JournalProvider } from "@/hooks/use-journal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <JournalProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile drawer */}
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Mobile top bar */}
          <MobileTopBar onOpenSidebar={() => setMobileOpen(true)} />

          <main className="flex-1 overflow-y-auto journal-bg">{children}</main>
        </div>
      </div>
    </JournalProvider>
  );
}
