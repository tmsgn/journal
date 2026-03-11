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

export const outcomeOptions = ["win", "loss", "breakeven"] as const;
export const directionOptions = ["long", "short"] as const;
export const sessionOptions = ["london", "new-york", "asian", "london-close"] as const;

// ─── Schema ──────────────────────────────────────────────────────────────────

export const tradeSchema = z.object({
  tradeDate: z.string().min(1),
  entryTimeframe: z.string().min(1, "Timeframe is required"),
  po3Time: z.string().optional(),
  rating: z.string().min(1, "Rating is required"),
  rr: z.coerce.number().min(0),
  outcome: z.enum(outcomeOptions),
  direction: z.enum(directionOptions),
  session: z.enum(sessionOptions),
  pnl: z.coerce.number().optional(),
  dol: z.array(z.string()).min(1, "At least one DOL is required"),
  model: z.array(z.string()).min(1, "At least one model is required"),
  reason: z.string().trim().min(1, "Reason is required"),
  emotions: z.string().trim().min(1, "Emotions note is required"),
  screenshotLow: z.string().trim().min(1, "Low TF screenshot is required"),
  screenshotMiddle: z
    .string()
    .trim()
    .min(1, "Middle TF screenshot is required"),
  screenshotHigh: z.string().trim().min(1, "High TF screenshot is required"),
});

export type TradeFormValues = z.infer<typeof tradeSchema>;

export type Trade = TradeFormValues & {
  id: string;
  shareToken?: string | null;
  createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// biome-ignore lint: any is fine for DB rows
export function rowToTrade(row: Record<string, unknown>): Trade {
  return {
    id: row.id as string,
    shareToken: (row.share_token as string) ?? null,
    createdAt: row.created_at as string,
    tradeDate: row.trade_date as string,
    entryTimeframe: row.entry_timeframe as string,
    po3Time: (row.po3_time as string) ?? undefined,
    rating: row.rating as string,
    rr: Number(row.rr),
    outcome: row.outcome as Trade["outcome"],
    direction: (row.direction as Trade["direction"]) ?? "long",
    session: (row.session as Trade["session"]) ?? "new-york",
    pnl: row.pnl != null ? Number(row.pnl) : undefined,
    dol: Array.isArray(row.dol)
      ? (row.dol as string[])
      : typeof row.dol === "string" && row.dol
        ? [row.dol]
        : [],
    model: Array.isArray(row.model)
      ? (row.model as string[])
      : typeof row.model === "string" && row.model
        ? [row.model]
        : [],
    reason: (row.reason as string) ?? "",
    emotions: (row.emotions as string) ?? "",
    screenshotLow: (row.screenshot_low as string) ?? "",
    screenshotMiddle: (row.screenshot_middle as string) ?? "",
    screenshotHigh: (row.screenshot_high as string) ?? "",
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
    direction: values.direction,
    session: values.session,
    pnl: values.pnl ?? null,
    dol: values.dol,
    model: values.model,
    reason: values.reason,
    emotions: values.emotions,
    screenshot_low: values.screenshotLow,
    screenshot_middle: values.screenshotMiddle,
    screenshot_high: values.screenshotHigh,
  };
}

export const getTodayDateString = () => new Date().toISOString().slice(0, 10);

// ─── Context ─────────────────────────────────────────────────────────────────

interface SessionStat {
  session: string;
  label: string;
  wins: number;
  losses: number;
  breakevens: number;
  total: number;
  winRate: number;
  netRR: number;
  totalPnL: number;
}

interface JournalStats {
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  avgRR: number;
  totalRR: number;
  // Advanced metrics
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  totalPnL: number;
  avgPnL: number;
  profitableDays: number;
  losingDays: number;
  // Streak
  streak: number;
  streakType: "win" | "loss" | "breakeven" | null;
  // Charts
  equityCurve: { date: string; rr: number; pnl: number }[];
  winRateByTimeframe: { timeframe: string; count: number; winRate: number; netRR: number }[];
  // Breakdowns
  modelAnalytics: {
    model: string;
    wins: number;
    total: number;
    winRate: number;
    totalRR: number;
    totalPnL: number;
  }[];
  dolAnalytics: {
    dol: string;
    wins: number;
    total: number;
    winRate: number;
    totalRR: number;
    totalPnL: number;
  }[];
  sessionAnalytics: SessionStat[];
  directionAnalytics: {
    direction: string;
    wins: number;
    total: number;
    winRate: number;
    netRR: number;
  }[];
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
    // avgRR: planned RR per trade (just the number logged, not used for PnL accounting)
    const avgRR =
      total > 0 ? trades.reduce((s, t) => s + Number(t.rr || 0), 0) / total : 0;

    // totalRR: wins add the full RR target, losses always cost exactly 1R
    // (2R trade means you risked 1R to gain 2R — a loss costs 1R, not 2R)
    const totalRR = trades.reduce(
      (s, t) =>
        s +
        (t.outcome === "win"
          ? Number(t.rr || 0)
          : t.outcome === "loss"
            ? -1
            : 0),
      0,
    );

    // ── Advanced metrics ──
    const winTrades = trades.filter((t) => t.outcome === "win");
    const lossTrades = trades.filter((t) => t.outcome === "loss");

    const grossProfit = winTrades.reduce((s, t) => s + Number(t.rr || 0), 0);
    // Each loss costs exactly 1R
    const grossLoss = lossTrades.length;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    const avgWin = winTrades.length > 0 ? grossProfit / winTrades.length : 0;
    // Avg loss is always 1R
    const avgLoss = lossTrades.length > 0 ? 1 : 0;

    const expectancy =
      total - breakevens > 0
        ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
        : 0;

    const largestWin = winTrades.length > 0 ? Math.max(...winTrades.map((t) => Number(t.rr || 0))) : 0;
    // Largest loss is always 1R (every loss costs exactly 1R)
    const largestLoss = lossTrades.length > 0 ? 1 : 0;

    // P&L stats (if entries have pnl)
    const tradesWithPnl = trades.filter((t) => t.pnl != null);
    const totalPnL = tradesWithPnl.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const avgPnL = tradesWithPnl.length > 0 ? totalPnL / tradesWithPnl.length : 0;

    // Profitable/losing days
    const dayMap = new Map<string, number>();
    for (const t of trades) {
      const rrContrib =
        t.outcome === "win"
          ? Number(t.rr || 0)
          : t.outcome === "loss"
            ? -1
            : 0;
      dayMap.set(t.tradeDate, (dayMap.get(t.tradeDate) ?? 0) + rrContrib);
    }
    let profitableDays = 0;
    let losingDays = 0;
    for (const v of dayMap.values()) {
      if (v > 0) profitableDays++;
      else if (v < 0) losingDays++;
    }

    // ── Max Drawdown ──
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    for (const t of [...trades].reverse()) {
      cumulative +=
        t.outcome === "win"
          ? Number(t.rr || 0)
          : t.outcome === "loss"
            ? -1
            : 0;
      if (cumulative > peak) peak = cumulative;
      const dd = peak - cumulative;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // ── Streak ──
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

    // ── Equity Curve ──
    let cumulativeRR = 0;
    let cumulativePnL = 0;
    const equityCurve = [...trades].reverse().map((t) => {
      cumulativeRR +=
        t.outcome === "win"
          ? Number(t.rr || 0)
          : t.outcome === "loss"
            ? -1
            : 0;
      cumulativePnL += t.pnl ?? 0;
      return {
        date: t.tradeDate,
        rr: parseFloat(cumulativeRR.toFixed(2)),
        pnl: parseFloat(cumulativePnL.toFixed(2)),
      };
    });

    // ── Timeframe analytics ──
    const timeframes = Array.from(new Set(trades.map((t) => t.entryTimeframe)));
    const winRateByTimeframe = timeframes.map((timeframe) => {
      const scoped = trades.filter((t) => t.entryTimeframe === timeframe);
      const scopedWins = scoped.filter((t) => t.outcome === "win").length;
      const netRR = scoped.reduce(
        (s, t) =>
          s +
          (t.outcome === "win"
            ? Number(t.rr || 0)
            : t.outcome === "loss"
              ? -1
              : 0),
        0,
      );
      return {
        timeframe,
        count: scoped.length,
        winRate: scoped.length > 0 ? (scopedWins / scoped.length) * 100 : 0,
        netRR: parseFloat(netRR.toFixed(2)),
      };
    });

    // ── Model Analytics ──
    const modelMap = new Map<
      string,
      { wins: number; total: number; totalRR: number; totalPnL: number }
    >();
    for (const t of trades) {
      if (!t.model) continue;
      const tradeRR =
        t.outcome === "win"
          ? Number(t.rr || 0)
          : t.outcome === "loss"
            ? -1
            : 0;
      for (const m of t.model) {
        const curr = modelMap.get(m) || { wins: 0, total: 0, totalRR: 0, totalPnL: 0 };
        curr.total++;
        if (t.outcome === "win") curr.wins++;
        curr.totalRR += tradeRR;
        curr.totalPnL += t.pnl ?? 0;
        modelMap.set(m, curr);
      }
    }
    const modelAnalytics = Array.from(modelMap.entries())
      .map(([model, data]) => ({
        model,
        ...data,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // ── DOL Analytics ──
    const dolMap = new Map<
      string,
      { wins: number; total: number; totalRR: number; totalPnL: number }
    >();
    for (const t of trades) {
      if (!t.dol || t.dol.length === 0) continue;
      const tradeRR =
        t.outcome === "win"
          ? Number(t.rr || 0)
          : t.outcome === "loss"
            ? -1
            : 0;
      for (const d of t.dol) {
        const curr = dolMap.get(d) || { wins: 0, total: 0, totalRR: 0, totalPnL: 0 };
        curr.total++;
        if (t.outcome === "win") curr.wins++;
        curr.totalRR += tradeRR;
        curr.totalPnL += t.pnl ?? 0;
        dolMap.set(d, curr);
      }
    }
    const dolAnalytics = Array.from(dolMap.entries())
      .map(([dol, data]) => ({
        dol,
        ...data,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // ── Session Analytics ──
    const sessionLabels: Record<string, string> = {
      london: "London",
      "new-york": "New York",
      asian: "Asian",
      "london-close": "London Close",
    };
    const sessionMap = new Map<
      string,
      { wins: number; losses: number; breakevens: number; total: number; netRR: number; totalPnL: number }
    >();
    for (const s of sessionOptions) {
      sessionMap.set(s, { wins: 0, losses: 0, breakevens: 0, total: 0, netRR: 0, totalPnL: 0 });
    }
    for (const t of trades) {
      if (!t.session) continue;
      const curr = sessionMap.get(t.session);
      if (!curr) continue;
      curr.total++;
      if (t.outcome === "win") { curr.wins++; curr.netRR += Number(t.rr || 0); }
      else if (t.outcome === "loss") { curr.losses++; curr.netRR -= 1; }
      else curr.breakevens++;
      curr.totalPnL += t.pnl ?? 0;
    }
    const sessionAnalytics: SessionStat[] = Array.from(sessionMap.entries()).map(([session, data]) => ({
      session,
      label: sessionLabels[session] ?? session,
      ...data,
      winRate: data.total - data.breakevens > 0 ? (data.wins / (data.total - data.breakevens)) * 100 : 0,
    }));

    // ── Direction Analytics ──
    const dirMap = new Map<string, { wins: number; total: number; netRR: number }>();
    for (const d of directionOptions) {
      dirMap.set(d, { wins: 0, total: 0, netRR: 0 });
    }
    for (const t of trades) {
      if (!t.direction) continue;
      const curr = dirMap.get(t.direction);
      if (!curr) continue;
      curr.total++;
      if (t.outcome === "win") { curr.wins++; curr.netRR += Number(t.rr || 0); }
      else if (t.outcome === "loss") curr.netRR -= 1;
    }
    const directionAnalytics = Array.from(dirMap.entries()).map(([direction, data]) => ({
      direction,
      ...data,
      winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
    }));

    return {
      total,
      wins,
      losses,
      breakevens,
      winRate,
      avgRR,
      totalRR,
      profitFactor,
      expectancy,
      maxDrawdown,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      totalPnL,
      avgPnL,
      profitableDays,
      losingDays,
      streak,
      streakType,
      equityCurve,
      winRateByTimeframe,
      modelAnalytics,
      dolAnalytics,
      sessionAnalytics,
      directionAnalytics,
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
    "Direction",
    "Session",
    "PO3",
    "Rating",
    "DOL",
    "Model",
    "RR",
    "PnL",
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
    t.direction ?? "",
    t.session ?? "",
    t.po3Time ?? "",
    t.rating,
    (t.dol ?? []).join(" | "),
    (t.model ?? []).join(" | "),
    t.rr,
    t.pnl ?? "",
    t.outcome,
    `"${(t.reason ?? "").replace(/"/g, '""')}"`,
    `"${(t.emotions ?? "").replace(/"/g, '""')}"`,
    t.screenshotLow ?? "",
    t.screenshotMiddle ?? "",
    t.screenshotHigh ?? "",
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
