"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) return null;

  const email = user.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  if (collapsed) {
    return (
      <div className="px-2 pb-3 flex justify-center">
        <button
          type="button"
          onClick={signOut}
          title={`Sign out (${email})`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-[11px] font-bold ring-1 ring-primary/30 hover:bg-red-400/20 hover:text-red-400 hover:ring-red-400/30 transition-colors"
        >
          {initials}
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 border-t border-sidebar-border">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold ring-1 ring-primary/30">
          {initials}
        </div>
        <div className={cn("flex flex-col min-w-0 flex-1")}>
          <span className="text-[11px] font-medium text-sidebar-foreground truncate">
            {email}
          </span>
          <span className="text-[9px] text-sidebar-foreground/40 uppercase tracking-wider">
            Signed in
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-400/10"
          onClick={signOut}
          title="Sign out"
        >
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
