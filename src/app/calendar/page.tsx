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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { TradeDetailSheet } from "@/components/trade-detail-sheet";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

type DayData = {
  date: string;
  trades: Trade[];
  wins: number;
  losses: number;
  breakevens: number;
  netRR: number;
};

function getDayColor(day: DayData | undefined): string {
  if (!day || day.trades.length === 0) return "";
  if (day.wins > day.losses && day.wins > day.breakevens)
    return "bg-emerald-500/80 hover:bg-emerald-500 text-white shadow-emerald-500/20";
  if (day.losses > day.wins && day.losses > day.breakevens)
    return "bg-red-500/80 hover:bg-red-500 text-white shadow-red-500/20";
  return "bg-yellow-500/70 hover:bg-yellow-500 text-white shadow-yellow-500/20";
}

function getDayIntensity(day: DayData | undefined): string {
  if (!day || day.trades.length === 0)
    return "bg-muted/30 hover:bg-muted/60 text-muted-foreground/40";
  return getDayColor(day);
}

export default function CalendarPage() {
  const { trades, hydrated } = useJournal();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Build a map of date → DayData
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const trade of trades) {
      const existing = map.get(trade.tradeDate);
      if (existing) {
        existing.trades.push(trade);
        if (trade.outcome === "win") existing.wins++;
        else if (trade.outcome === "loss") existing.losses++;
        else existing.breakevens++;
        existing.netRR +=
          trade.outcome === "win"
            ? Number(trade.rr)
            : trade.outcome === "loss"
              ? -1
              : 0;
      } else {
        map.set(trade.tradeDate, {
          date: trade.tradeDate,
          trades: [trade],
          wins: trade.outcome === "win" ? 1 : 0,
          losses: trade.outcome === "loss" ? 1 : 0,
          breakevens: trade.outcome === "breakeven" ? 1 : 0,
          netRR:
            trade.outcome === "win"
              ? Number(trade.rr)
              : trade.outcome === "loss"
                ? -1
                : 0,
        });
      }
    }
    return map;
  }, [trades]);

  // Build calendar grid
  const { weeks, totalDays } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();

    // Pad start
    const cells: (number | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad end to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    // Split into weeks
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return { weeks, totalDays: daysInMonth };
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  // Month summary stats
  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    let wins = 0,
      losses = 0,
      breakevens = 0,
      netRR = 0,
      total = 0;
    for (const [date, day] of dayMap) {
      if (date.startsWith(prefix)) {
        wins += day.wins;
        losses += day.losses;
        breakevens += day.breakevens;
        netRR += day.netRR;
        total += day.trades.length;
      }
    }
    const winRate =
      total - breakevens > 0 ? (wins / (total - breakevens)) * 100 : 0;
    return { wins, losses, breakevens, netRR, total, winRate };
  }, [dayMap, year, month]);

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const data = dayMap.get(dateStr);
    if (data && data.trades.length > 0) {
      setSelectedDay(data);
    }
  };

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const rrSign = monthStats.netRR >= 0 ? "+" : "";

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Trading Calendar
        </h1>
        <p className="text-muted-foreground text-sm">
          Daily activity heatmap — green wins, red losses, yellow mixed/BE
        </p>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Trades",
            value: monthStats.total,
            className: "text-foreground",
          },
          {
            label: "Win Rate",
            value: `${numberFormatter.format(monthStats.winRate)}%`,
            className:
              monthStats.winRate >= 50 ? "text-emerald-400" : "text-red-400",
          },
          {
            label: "Net RR",
            value: `${rrSign}${numberFormatter.format(monthStats.netRR)}R`,
            className:
              monthStats.netRR >= 0 ? "text-emerald-400" : "text-red-400",
          },
          {
            label: "W/L/BE",
            value: `${monthStats.wins}/${monthStats.losses}/${monthStats.breakevens}`,
            className: "text-foreground",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 bg-card/80">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {s.label}
              </p>
              <p className={`text-xl font-bold mt-0.5 ${s.className}`}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Calendar */}
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {MONTHS[month]} {year}
                </CardTitle>
                <CardDescription className="text-xs">
                  {totalDays} days · click a day to see trades
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={prevMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={nextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] font-medium text-muted-foreground/60 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex flex-col gap-1.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1.5">
                  {week.map((day, di) => {
                    if (!day) {
                      return <div key={di} className="aspect-square" />;
                    }
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const data = dayMap.get(dateStr);
                    const isToday =
                      dateStr === new Date().toISOString().slice(0, 10);
                    const colorClass = getDayIntensity(data);
                    const hasData = data && data.trades.length > 0;

                    return (
                      <button
                        key={di}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        title={
                          hasData
                            ? `${data!.trades.length} trade${data!.trades.length > 1 ? "s" : ""} · ${rrSign}${numberFormatter.format(data!.netRR)}R`
                            : dateStr
                        }
                        className={`
                        aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-150 shadow-sm
                        ${colorClass}
                        ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}
                        ${hasData ? "cursor-pointer scale-100 hover:scale-105 shadow" : "cursor-default"}
                      `}
                      >
                        <span className="text-[11px] font-semibold leading-none">
                          {day}
                        </span>
                        {hasData && (
                          <span className="text-[9px] leading-none mt-0.5 opacity-90">
                            {data!.trades.length}t
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border/40">
              {[
                { color: "bg-emerald-500/80", label: "Win day" },
                { color: "bg-red-500/80", label: "Loss day" },
                { color: "bg-yellow-500/70", label: "Mixed / BE" },
                { color: "bg-muted/30", label: "No trades" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded-sm ${l.color}`} />
                  <span className="text-[11px] text-muted-foreground">
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day detail side-panel */}
        <div className="flex flex-col gap-6 sticky top-6">
          {selectedDay ? (
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm flex flex-col max-h-[calc(100vh-8rem)]">
              <CardHeader className="pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {selectedDay.date}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {selectedDay.trades.length} trade
                      {selectedDay.trades.length > 1 ? "s" : ""} ·{" "}
                      {selectedDay.wins}W · {selectedDay.losses}L ·{" "}
                      {selectedDay.breakevens}BE ·{" "}
                      <span
                        className={
                          selectedDay.netRR >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {selectedDay.netRR >= 0 ? "+" : ""}
                        {numberFormatter.format(selectedDay.netRR)}R
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setSelectedDay(null)}
                  >
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 pb-2 overflow-y-auto">
                <div className="divide-y divide-border/30">
                  {selectedDay.trades.map((trade) => (
                    <button
                      key={trade.id}
                      type="button"
                      onClick={() => setSelectedTrade(trade)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left group"
                    >
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${trade.outcome === "win" ? "bg-emerald-500" : trade.outcome === "loss" ? "bg-red-500" : "bg-yellow-500"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className="font-mono text-[9px] py-0 px-1"
                          >
                            {trade.entryTimeframe}
                          </Badge>
                          <span className="text-xs font-bold text-primary">
                            {trade.rating}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground block line-clamp-2">
                          {trade.reason}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span
                          className={`text-sm font-bold font-mono shrink-0 ${trade.outcome === "win" ? "text-emerald-400" : trade.outcome === "loss" ? "text-red-400" : "text-yellow-400"}`}
                        >
                          {trade.outcome === "win"
                            ? "+"
                            : trade.outcome === "loss"
                              ? "-"
                              : ""}
                          {numberFormatter.format(trade.rr)}R
                        </span>
                        {trade.outcome === "win" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0 opacity-80" />
                        ) : trade.outcome === "loss" ? (
                          <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0 opacity-80" />
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm opacity-60 flex flex-col h-64 shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground h-full flex-1 gap-2">
                <CalendarDays className="h-8 w-8 opacity-40" />
                <p className="text-sm font-medium">No Date Selected</p>
                <p className="text-xs opacity-70">
                  Select a populated day on the calendar to preview trade
                  details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TradeDetailSheet
        trade={selectedTrade}
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
}
