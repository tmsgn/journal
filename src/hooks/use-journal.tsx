"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Constants ───────────────────────────────────────────────────────────────

export const entryTimeframeOptions = [
  "30sec",
  "1min",
  "2min",
  "3min",
  "5min",
] as const;
export const ratingOptions = ["A+", "A", "A-", "B+", "B", "B-"] as const;
export const po3TimeOptions = [
  "9:30",
  "9:45",
  "10:00",
  "10:15",
  "10:30",
] as const;
export const outcomeOptions = ["win", "loss", "breakeven"] as const;

// ─── Schema ──────────────────────────────────────────────────────────────────

export const tradeSchema = z.object({
  tradeDate: z.string().min(1),
  entryTimeframe: z.enum(entryTimeframeOptions),
  po3Time: z.enum(po3TimeOptions).optional(),
  rating: z.enum(ratingOptions),
  rr: z.coerce.number().min(0),
  outcome: z.enum(outcomeOptions),
  reason: z.string().trim().min(1, "Reason is required"),
  emotions: z.string().trim().min(1, "Emotions note is required"),
  screenshotLow: z.string().trim().optional(),
  screenshotMiddle: z.string().trim().optional(),
  screenshotHigh: z.string().trim().optional(),
});

export type TradeFormValues = z.infer<typeof tradeSchema>;

export type Trade = TradeFormValues & {
  id: string;
  createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// biome-ignore lint: any is fine for DB rows
function rowToTrade(row: Record<string, unknown>): Trade {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    tradeDate: row.trade_date as string,
    entryTimeframe: row.entry_timeframe as Trade["entryTimeframe"],
    po3Time: (row.po3_time as Trade["po3Time"]) ?? undefined,
    rating: row.rating as Trade["rating"],
    rr: Number(row.rr),
    outcome: row.outcome as Trade["outcome"],
    reason: (row.reason as string) ?? "",
    emotions: (row.emotions as string) ?? "",
    screenshotLow: (row.screenshot_low as string) ?? undefined,
    screenshotMiddle: (row.screenshot_middle as string) ?? undefined,
    screenshotHigh: (row.screenshot_high as string) ?? undefined,
  };
}

function tradeToRow(values: TradeFormValues, userId: string) {
  return {
    user_id: userId,
    trade_date: values.tradeDate,
    entry_timeframe: values.entryTimeframe,
    po3_time: values.po3Time ?? null,
    rating: values.rating,
    rr: values.rr,
    outcome: values.outcome,
    reason: values.reason,
    emotions: values.emotions,
    screenshot_low: values.screenshotLow ?? null,
    screenshot_middle: values.screenshotMiddle ?? null,
    screenshot_high: values.screenshotHigh ?? null,
  };
}

export const getTodayDateString = () => new Date().toISOString().slice(0, 10);

// ─── Context ─────────────────────────────────────────────────────────────────

interface JournalStats {
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  avgRR: number;
  totalRR: number;
  streak: number;
  streakType: "win" | "loss" | "breakeven" | null;
  equityCurve: { date: string; rr: number }[];
  winRateByTimeframe: { timeframe: string; count: number; winRate: number }[];
}

interface JournalContextValue {
  trades: Trade[];
  hydrated: boolean;
  userId: string | null;
  stats: JournalStats;
  addTrade: (values: TradeFormValues) => Promise<{ error: string | null }>;
  deleteTrade: (id: string) => Promise<void>;
  updateTrade: (
    id: string,
    values: TradeFormValues,
  ) => Promise<{ error: string | null }>;
}

const JournalContext = createContext<JournalContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function JournalProvider({ children }: { children: ReactNode }) {
  const supabaseRef = useRef<SupabaseClient>(createClient());
  const supabase = supabaseRef.current;

  const [trades, setTrades] = useState<Trade[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTrades = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from("journal_trades")
        .select("*")
        .eq("user_id", uid)
        .order("trade_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTrades(data.map(rowToTrade));
      }
      setHydrated(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!userId) return;
    fetchTrades(userId);

    realtimeRef.current = supabase
      .channel(`journal_trades:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "journal_trades",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTrades(userId);
        },
      )
      .subscribe();

    return () => {
      realtimeRef.current?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const addTrade = async (
    values: TradeFormValues,
  ): Promise<{ error: string | null }> => {
    if (!userId) return { error: "Not signed in" };
    const parsed = tradeSchema.parse(values);
    const { error } = await supabase
      .from("journal_trades")
      .insert(tradeToRow(parsed, userId));
    if (error) return { error: error.message };
    await fetchTrades(userId);
    return { error: null };
  };

  const deleteTrade = async (id: string) => {
    await supabase.from("journal_trades").delete().eq("id", id);
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTrade = async (
    id: string,
    values: TradeFormValues,
  ): Promise<{ error: string | null }> => {
    if (!userId) return { error: "Not signed in" };
    const parsed = tradeSchema.parse(values);
    const row = tradeToRow(parsed, userId);
    const { user_id: _uid, ...updateFields } = row;
    const { error } = await supabase
      .from("journal_trades")
      .update(updateFields)
      .eq("id", id);
    if (error) return { error: error.message };
    setTrades((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...parsed, tradeDate: parsed.tradeDate } : t,
      ),
    );
    return { error: null };
  };

  const stats = useMemo((): JournalStats => {
    const total = trades.length;
    const wins = trades.filter((t) => t.outcome === "win").length;
    const losses = trades.filter((t) => t.outcome === "loss").length;
    const breakevens = trades.filter((t) => t.outcome === "breakeven").length;
    const winRate =
      total - breakevens > 0 ? (wins / (total - breakevens)) * 100 : 0;
    const avgRR =
      total > 0 ? trades.reduce((s, t) => s + Number(t.rr || 0), 0) / total : 0;
    const totalRR = trades.reduce(
      (s, t) =>
        s +
        (t.outcome === "win"
          ? Number(t.rr || 0)
          : t.outcome === "loss"
            ? -Math.max(Number(t.rr || 0), 1)
            : 0),
      0,
    );

    let streak = 0;
    let streakType: "win" | "loss" | "breakeven" | null = null;
    for (const t of trades) {
      if (!streakType) {
        streakType = t.outcome;
        streak = 1;
      } else if (t.outcome === streakType) {
        streak++;
      } else break;
    }

    let cumulative = 0;
    const equityCurve = [...trades].reverse().map((t) => {
      cumulative +=
        t.outcome === "win"
          ? Number(t.rr || 0)
          : t.outcome === "loss"
            ? -Math.max(Number(t.rr || 0), 1)
            : 0;
      return { date: t.tradeDate, rr: parseFloat(cumulative.toFixed(2)) };
    });

    const winRateByTimeframe = entryTimeframeOptions.map((timeframe) => {
      const scoped = trades.filter((t) => t.entryTimeframe === timeframe);
      const scopedWins = scoped.filter((t) => t.outcome === "win").length;
      return {
        timeframe,
        count: scoped.length,
        winRate: scoped.length > 0 ? (scopedWins / scoped.length) * 100 : 0,
      };
    });

    return {
      total,
      wins,
      losses,
      breakevens,
      winRate,
      avgRR,
      totalRR,
      streak,
      streakType,
      equityCurve,
      winRateByTimeframe,
    };
  }, [trades]);

  return (
    <JournalContext.Provider
      value={{
        trades,
        hydrated,
        userId,
        stats,
        addTrade,
        deleteTrade,
        updateTrade,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used inside JournalProvider");
  return ctx;
}

// ─── CSV export ───────────────────────────────────────────────────────────────

export function tradesToCsv(trades: Trade[]): string {
  const headers = [
    "Date",
    "Timeframe",
    "PO3",
    "Rating",
    "RR",
    "Outcome",
    "Reason",
    "Emotions",
    "Screenshot Low",
    "Screenshot Mid",
    "Screenshot High",
  ];
  const rows = trades.map((t) => [
    t.tradeDate,
    t.entryTimeframe,
    t.po3Time ?? "",
    t.rating,
    t.rr,
    t.outcome,
    `"${(t.reason ?? "").replace(/"/g, '""')}"`,
    `"${(t.emotions ?? "").replace(/"/g, '""')}"`,
    t.screenshotLow ?? "",
    t.screenshotMiddle ?? "",
    t.screenshotHigh ?? "",
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
