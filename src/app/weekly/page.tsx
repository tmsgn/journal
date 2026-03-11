"use client";

import { useMemo, useState } from "react";
import { useJournal, type Trade } from "@/hooks/use-journal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TradeDetailSheet } from "@/components/trade-detail-sheet";
import {
  CalendarRange,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const DOW_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DOW_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Returns ISO week number and year for a date string
function getIsoWeek(dateStr: string): {
  week: number;
  year: number;
  weekStart: string;
} {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay() === 0 ? 7 : d.getDay(); // Mon=1 ... Sun=7
  d.setDate(d.getDate() + 4 - day);
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(
    ((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7,
  );
  // Get Monday of that week
  const orig = new Date(`${dateStr}T12:00:00`);
  const origDay = orig.getDay() === 0 ? 7 : orig.getDay();
  orig.setDate(orig.getDate() - (origDay - 1));
  const weekStart = orig.toISOString().slice(0, 10);
  return { week, year, weekStart };
}

function getWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 4); // Friday
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

interface WeekSummary {
  weekStart: string;
  weekLabel: string;
  trades: Trade[];
  wins: number;
  losses: number;
  breakevens: number;
  total: number;
  winRate: number;
  netRR: number;
  avgRR: number;
  byDay: Record<
    string,
    { trades: Trade[]; wins: number; losses: number; netRR: number }
  >;
}

const dowChartConfig = {
  winRate: { label: "Win Rate %", color: "var(--chart-1)" },
  netRR: { label: "Net RR", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function WeeklyPage() {
  const { trades, hydrated } = useJournal();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current/most recent week

  // Group all trades by ISO week
  const weeks = useMemo((): WeekSummary[] => {
    const weekMap = new Map<string, WeekSummary>();

    for (const trade of trades) {
      const { weekStart } = getIsoWeek(trade.tradeDate);
      let summary = weekMap.get(weekStart);
      if (!summary) {
        summary = {
          weekStart,
          weekLabel: getWeekRange(weekStart),
          trades: [],
          wins: 0,
          losses: 0,
          breakevens: 0,
          total: 0,
          winRate: 0,
          netRR: 0,
          avgRR: 0,
          byDay: {},
        };
        weekMap.set(weekStart, summary);
      }
      summary.trades.push(trade);
      if (trade.outcome === "win") summary.wins++;
      else if (trade.outcome === "loss") summary.losses++;
      else summary.breakevens++;
      summary.total++;
      const rrContrib =
        trade.outcome === "win"
          ? Number(trade.rr)
          : trade.outcome === "loss"
            ? -1
            : 0;
      summary.netRR += rrContrib;

      // By day of week (YYYY-MM-DD key)
      const dayKey = trade.tradeDate;
      if (!summary.byDay[dayKey]) {
        summary.byDay[dayKey] = { trades: [], wins: 0, losses: 0, netRR: 0 };
      }
      summary.byDay[dayKey].trades.push(trade);
      if (trade.outcome === "win") summary.byDay[dayKey].wins++;
      else if (trade.outcome === "loss") summary.byDay[dayKey].losses++;
      summary.byDay[dayKey].netRR += rrContrib;
    }

    // Compute derived
    for (const s of weekMap.values()) {
      const nonBE = s.total - s.breakevens;
      s.winRate = nonBE > 0 ? (s.wins / nonBE) * 100 : 0;
      s.avgRR =
        s.total > 0
          ? trades
              .filter((t) => s.trades.includes(t))
              .reduce((acc, t) => acc + Number(t.rr), 0) / s.total
          : 0;
    }

    return Array.from(weekMap.values()).sort((a, b) =>
      b.weekStart.localeCompare(a.weekStart),
    );
  }, [trades]);

  // Day-of-week analysis across ALL trades
  const dowStats = useMemo(() => {
    const map: Record<
      number,
      {
        wins: number;
        losses: number;
        breakevens: number;
        netRR: number;
        total: number;
      }
    > = {
      1: { wins: 0, losses: 0, breakevens: 0, netRR: 0, total: 0 },
      2: { wins: 0, losses: 0, breakevens: 0, netRR: 0, total: 0 },
      3: { wins: 0, losses: 0, breakevens: 0, netRR: 0, total: 0 },
      4: { wins: 0, losses: 0, breakevens: 0, netRR: 0, total: 0 },
      5: { wins: 0, losses: 0, breakevens: 0, netRR: 0, total: 0 },
    };
    for (const trade of trades) {
      const d = new Date(`${trade.tradeDate}T12:00:00`);
      const dow = d.getDay(); // 0=Sun...6=Sat
      if (dow < 1 || dow > 5) continue; // skip weekends
      const rrContrib =
        trade.outcome === "win"
          ? Number(trade.rr)
          : trade.outcome === "loss"
            ? -1
            : 0;
      map[dow].total++;
      map[dow].netRR += rrContrib;
      if (trade.outcome === "win") map[dow].wins++;
      else if (trade.outcome === "loss") map[dow].losses++;
      else map[dow].breakevens++;
    }
    return [1, 2, 3, 4, 5].map((dow) => ({
      day: DOW_SHORT[dow - 1],
      label: DOW_LABELS[dow - 1],
      total: map[dow].total,
      wins: map[dow].wins,
      losses: map[dow].losses,
      winRate:
        map[dow].total - map[dow].breakevens > 0
          ? (map[dow].wins / (map[dow].total - map[dow].breakevens)) * 100
          : 0,
      netRR: parseFloat(map[dow].netRR.toFixed(2)),
    }));
  }, [trades]);

  const currentWeek = weeks[weekOffset] ?? null;

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-80 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const rrColor = (rr: number) =>
    rr >= 0 ? "text-emerald-400" : "text-red-400";
  const rrPrefix = (rr: number) => (rr >= 0 ? "+" : "");

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarRange className="h-6 w-6 text-primary" />
          Weekly Analysis
        </h1>
        <p className="text-muted-foreground text-sm">
          Performance broken down by week and day of week
        </p>
      </div>

      {weeks.length === 0 ? (
        <Card className="border-border/60 bg-card/80">
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            No trades logged yet.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Weekly Detail ── */}
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Week of {currentWeek?.weekLabel ?? "—"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {currentWeek?.total ?? 0} trade
                    {(currentWeek?.total ?? 0) !== 1 ? "s" : ""} this week
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setWeekOffset((o) => Math.min(o + 1, weeks.length - 1))
                    }
                    disabled={weekOffset >= weeks.length - 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-16 text-center">
                    {weekOffset === 0 ? "Latest" : `${weekOffset}w ago`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setWeekOffset((o) => Math.max(o - 1, 0))}
                    disabled={weekOffset === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Week stat pills */}
              {currentWeek && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Trades",
                      value: currentWeek.total,
                      cls: "text-foreground",
                    },
                    {
                      label: "Win Rate",
                      value: `${numberFormatter.format(currentWeek.winRate)}%`,
                      cls:
                        currentWeek.winRate >= 50
                          ? "text-emerald-400"
                          : "text-red-400",
                    },
                    {
                      label: "Net RR",
                      value: `${rrPrefix(currentWeek.netRR)}${numberFormatter.format(currentWeek.netRR)}R`,
                      cls: rrColor(currentWeek.netRR),
                    },
                    {
                      label: "W / L / BE",
                      value: `${currentWeek.wins} / ${currentWeek.losses} / ${currentWeek.breakevens}`,
                      cls: "text-foreground",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-lg bg-muted/30 border border-border/40 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                        {s.label}
                      </p>
                      <p className={`text-lg font-bold mt-0.5 ${s.cls}`}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Day-by-day breakdown for selected week */}
              {currentWeek && (
                <div className="grid gap-2">
                  {Object.entries(currentWeek.byDay)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateStr, day]) => {
                      const winRate =
                        day.trades.length > 0
                          ? (day.wins / day.trades.length) * 100
                          : 0;
                      const d = new Date(`${dateStr}T12:00:00`);
                      const dowName = d.toLocaleDateString("en-US", {
                        weekday: "long",
                      });
                      return (
                        <div
                          key={dateStr}
                          className="rounded-lg border border-border/40 bg-background/40 p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">
                                {dowName}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {dateStr}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-bold font-mono ${rrColor(day.netRR)}`}
                              >
                                {rrPrefix(day.netRR)}
                                {numberFormatter.format(day.netRR)}R
                              </span>
                              <Badge
                                className={`text-[10px] ${day.wins > day.losses ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : day.losses > day.wins ? "bg-red-500/15 text-red-400 border-red-500/25" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"}`}
                              >
                                {day.wins}W · {day.losses}L
                              </Badge>
                            </div>
                          </div>
                          {/* Trade list for this day */}
                          <div className="space-y-1">
                            {day.trades.map((trade) => (
                              <button
                                key={trade.id}
                                type="button"
                                onClick={() => setSelectedTrade(trade)}
                                className="w-full flex items-start gap-2 text-left rounded-md px-2 py-2 hover:bg-primary/5 transition-colors"
                              >
                                <div className="flex shrink-0 items-center gap-2 mt-0.5">
                                  {trade.outcome === "win" ? (
                                    <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                                  ) : trade.outcome === "loss" ? (
                                    <TrendingDown className="h-3 w-3 text-red-400 shrink-0" />
                                  ) : (
                                    <Minus className="h-3 w-3 text-yellow-400 shrink-0" />
                                  )}
                                  <Badge
                                    variant="secondary"
                                    className="font-mono text-[10px] py-0"
                                  >
                                    {trade.entryTimeframe}
                                  </Badge>
                                  <span className="text-xs font-bold text-primary">
                                    {trade.rating}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground flex-1 break-words mt-0.5 max-w-full">
                                  {trade.reason}
                                </span>
                                <div className="text-right shrink-0 mt-0.5">
                                  <span
                                    className={`text-xs font-mono font-semibold ${rrColor(trade.outcome === "win" ? 1 : -1)}`}
                                  >
                                    {trade.outcome === "win"
                                      ? "+"
                                      : trade.outcome === "loss"
                                        ? "-"
                                        : ""}
                                    {numberFormatter.format(trade.rr)}R
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── All Weeks Summary Table ── */}
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                All Weeks
              </CardTitle>
              <CardDescription className="text-xs">
                Historical week-by-week summary
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-1">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      {["Week", "Trades", "W/L/BE", "Win %", "Net RR"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 first:pl-6 last:pr-6"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((w, i) => (
                      <tr
                        key={w.weekStart}
                        onClick={() => setWeekOffset(i)}
                        className={`border-b border-border/30 cursor-pointer transition-colors ${weekOffset === i ? "bg-primary/8" : "hover:bg-primary/4"}`}
                      >
                        <td className="pl-6 py-2.5 text-xs font-mono text-muted-foreground">
                          {w.weekLabel}
                        </td>
                        <td className="px-4 py-2.5 text-xs">{w.total}</td>
                        <td className="px-4 py-2.5 text-xs">
                          {w.wins}/{w.losses}/{w.breakevens}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-xs font-semibold ${w.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {numberFormatter.format(w.winRate)}%
                          </span>
                        </td>
                        <td className="pr-6 py-2.5">
                          <span
                            className={`text-xs font-bold font-mono ${rrColor(w.netRR)}`}
                          >
                            {rrPrefix(w.netRR)}
                            {numberFormatter.format(w.netRR)}R
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Day-of-Week Stats ── */}
      <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Day-of-Week Performance
          </CardTitle>
          <CardDescription className="text-xs">
            All-time win rate and net RR broken down by trading day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chart */}
          <ChartContainer config={dowChartConfig} className="h-52 w-full">
            <BarChart data={dowStats} barSize={28} barGap={6}>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: "var(--primary)", fillOpacity: 0.05 }}
              />
              <Bar dataKey="winRate" radius={[5, 5, 0, 0]} name="Win Rate %">
                {dowStats.map((entry) => (
                  <Cell
                    key={entry.day}
                    fill={
                      entry.winRate >= 50 ? "var(--chart-1)" : "var(--chart-5)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>

          {/* DOW stat pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {dowStats.map((d) => (
              <div
                key={d.day}
                className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center"
              >
                <p className="text-xs font-semibold text-muted-foreground">
                  {d.day}
                </p>
                <p
                  className={`text-base font-bold mt-1 ${d.winRate >= 50 ? "text-emerald-400" : d.total === 0 ? "text-muted-foreground" : "text-red-400"}`}
                >
                  {d.total === 0
                    ? "—"
                    : `${numberFormatter.format(d.winRate)}%`}
                </p>
                <p className={`text-xs font-mono mt-0.5 ${rrColor(d.netRR)}`}>
                  {d.total === 0
                    ? ""
                    : `${rrPrefix(d.netRR)}${numberFormatter.format(d.netRR)}R`}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {d.total}t
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <TradeDetailSheet
        trade={selectedTrade}
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
}
