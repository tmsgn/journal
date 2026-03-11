"use client";

import { useMemo } from "react";
import { useJournal } from "@/hooks/use-journal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown, Target, Zap, Clock } from "lucide-react";

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const fmtPnl = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function ProgressBar({ value, max, color = "var(--chart-1)" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function WinRateBar({ winRate }: { winRate: number }) {
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(winRate, 100)}%`,
          background: winRate >= 50 ? "oklch(0.70 0.175 175)" : "oklch(0.60 0.22 25)",
        }}
      />
    </div>
  );
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 backdrop-blur-sm px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className={`font-semibold ${p.value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {p.name}: {p.value >= 0 ? "+" : ""}{fmt.format(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { trades, stats, hydrated } = useJournal();

  // P&L by day-of-week
  const dowStats = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const map: Record<number, { wins: number; losses: number; breakevens: number; netRR: number; total: number; totalPnL: number }> = {
      1: { wins: 0, losses: 0, breakevens: 0, netRR: 0, total: 0, totalPnL: 0 },
      2: { wins: 0, losses: 0, breakevens: 0, netRR: 0, total: 0, totalPnL: 0 },
      3: { wins: 0, losses: 0, breakevens: 0, netRR: 0, total: 0, totalPnL: 0 },
      4: { wins: 0, losses: 0, breakevens: 0, netRR: 0, total: 0, totalPnL: 0 },
      5: { wins: 0, losses: 0, breakevens: 0, netRR: 0, total: 0, totalPnL: 0 },
    };
    for (const t of trades) {
      const d = new Date(`${t.tradeDate}T12:00:00`);
      const dow = d.getDay();
      if (dow < 1 || dow > 5) continue;
      map[dow].total++;
      const rr = t.outcome === "win" ? Number(t.rr || 0) : t.outcome === "loss" ? -1 : 0;
      map[dow].netRR += rr;
      map[dow].totalPnL += t.pnl ?? 0;
      if (t.outcome === "win") map[dow].wins++;
      else if (t.outcome === "loss") map[dow].losses++;
      else map[dow].breakevens++;
    }
    return [1, 2, 3, 4, 5].map((dow) => ({
      day: labels[dow - 1],
      ...map[dow],
      winRate: map[dow].total - map[dow].breakevens > 0 ? (map[dow].wins / (map[dow].total - map[dow].breakevens)) * 100 : 0,
      netRR: parseFloat(map[dow].netRR.toFixed(2)),
    }));
  }, [trades]);

  // Win/Loss/BE distribution
  const distributionData = useMemo(() => [
    { name: "Wins", value: stats.wins, fill: "oklch(0.58 0.18 155)" },
    { name: "Losses", value: stats.losses, fill: "oklch(0.60 0.22 25)" },
    { name: "Breakeven", value: stats.breakevens, fill: "oklch(0.70 0.16 85)" },
  ].filter((d) => d.value > 0), [stats]);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="h-8 w-56 rounded-lg bg-muted animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const maxDOWrr = Math.max(...dowStats.map((d) => Math.abs(d.netRR)), 1);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 journal-bg min-h-full">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm">
          Deep-dive into your trading performance patterns
        </p>
      </div>

      {/* Overview metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Profit Factor",
            value: stats.profitFactor >= 999 ? "∞" : fmt.format(stats.profitFactor),
            sub: "Gross profit ÷ gross loss",
            icon: Zap,
            color: stats.profitFactor >= 1.5 ? "text-emerald-400" : "text-red-400",
          },
          {
            label: "Expectancy",
            value: `${stats.expectancy >= 0 ? "+" : ""}${fmt.format(stats.expectancy)}R`,
            sub: "Expected R per trade",
            icon: Target,
            color: stats.expectancy > 0 ? "text-emerald-400" : "text-red-400",
          },
          {
            label: "Profitable Days",
            value: `${stats.profitableDays} / ${stats.profitableDays + stats.losingDays}`,
            sub: "Days with net profit",
            icon: TrendingUp,
            color: "text-foreground",
          },
          {
            label: "Avg R per Trade",
            value: `${stats.avgRR >= 0 ? "+" : ""}${fmt.format(stats.avgRR)}R`,
            sub: "Including losses",
            icon: TrendingDown,
            color: stats.avgRR > 0 ? "text-emerald-400" : "text-red-400",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{s.label}</p>
                <s.icon className="h-3.5 w-3.5 text-muted-foreground/50" />
              </div>
              <p className={`text-xl font-bold font-trading ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Day-of-Week RR Chart */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Day-of-Week Performance</CardTitle>
            <CardDescription className="text-xs">Net RR by trading day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dowStats} margin={{ top: 4, right: 4, left: -25, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.5} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickFormatter={(v) => `${v}R`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--primary)", fillOpacity: 0.05 }} />
                <Bar dataKey="netRR" name="Net RR" radius={[5, 5, 0, 0]} maxBarSize={50}>
                  {dowStats.map((entry) => (
                    <Cell
                      key={entry.day}
                      fill={entry.netRR >= 0 ? "oklch(0.70 0.175 175)" : "oklch(0.60 0.22 25)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* DOW stat pills */}
            <div className="grid grid-cols-5 gap-1.5 mt-3">
              {dowStats.map((d) => (
                <div key={d.day} className="text-center rounded-lg bg-muted/30 border border-border/30 py-2 px-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{d.day}</p>
                  <p className={`text-xs font-bold font-trading mt-0.5 ${d.winRate >= 50 ? "text-emerald-400" : d.total === 0 ? "text-muted-foreground" : "text-red-400"}`}>
                    {d.total === 0 ? "—" : `${fmt.format(d.winRate)}%`}
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5">{d.total}t</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Win/Loss Pie */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Trade Distribution</CardTitle>
            <CardDescription className="text-xs">Outcome breakdown (all trades)</CardDescription>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} trades`, name]}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center">
                <p className="text-base font-bold text-emerald-400">{stats.wins}</p>
                <p className="text-[10px] text-muted-foreground">Wins</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-red-400">{stats.losses}</p>
                <p className="text-[10px] text-muted-foreground">Losses</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-yellow-400">{stats.breakevens}</p>
                <p className="text-[10px] text-muted-foreground">BE</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Analysis */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Session Analysis
          </CardTitle>
          <CardDescription className="text-xs">Performance by trading session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.sessionAnalytics.map((s) => (
              <div key={s.session} className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <p className="text-xs font-semibold text-foreground mb-3">{s.label}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Win Rate</span>
                    <span className={`text-xs font-bold font-trading ${s.winRate >= 50 ? "text-emerald-400" : s.total === 0 ? "text-muted-foreground" : "text-red-400"}`}>
                      {s.total === 0 ? "—" : `${fmt.format(s.winRate)}%`}
                    </span>
                  </div>
                  <WinRateBar winRate={s.winRate} />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">Net RR</span>
                    <span className={`text-xs font-mono font-bold ${s.netRR >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.netRR >= 0 ? "+" : ""}{fmt.format(s.netRR)}R
                    </span>
                  </div>
                  {s.totalPnL !== 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">P&L</span>
                      <span className={`text-[10px] font-mono ${s.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtPnl.format(s.totalPnL)}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground/60">{s.total} trades · {s.wins}W {s.losses}L</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Direction Analysis + Timeframe Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Direction */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Direction Analysis</CardTitle>
            <CardDescription className="text-xs">Long vs Short performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.directionAnalytics.map((d) => (
              <div key={d.direction} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${d.direction === "long" ? "badge-long" : "badge-short"}`}>
                      {d.direction === "long" ? "↑ Long" : "↓ Short"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{d.total} trades</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono font-bold ${d.netRR >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {d.netRR >= 0 ? "+" : ""}{fmt.format(d.netRR)}R
                    </span>
                    <span className={`text-xs font-bold ${d.winRate >= 50 ? "text-emerald-400" : d.total === 0 ? "text-muted-foreground" : "text-red-400"}`}>
                      {d.total === 0 ? "—" : `${fmt.format(d.winRate)}%`}
                    </span>
                  </div>
                </div>
                <WinRateBar winRate={d.winRate} />
              </div>
            ))}
            {stats.directionAnalytics.every((d) => d.total === 0) && (
              <p className="text-xs text-muted-foreground italic text-center py-6">Log trades with direction to see analysis</p>
            )}
          </CardContent>
        </Card>

        {/* Timeframe */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Timeframe Performance</CardTitle>
            <CardDescription className="text-xs">Win rate and RR per entry timeframe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.winRateByTimeframe.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">No trade data yet</p>
            ) : (
              stats.winRateByTimeframe.map((tf) => (
                <div key={tf.timeframe} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold font-mono bg-muted/50 border border-border/40 px-1.5 py-0.5 rounded">
                        {tf.timeframe}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{tf.count} trades</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-bold ${tf.netRR >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {tf.netRR >= 0 ? "+" : ""}{fmt.format(tf.netRR)}R
                      </span>
                      <span className={`text-xs font-bold ${tf.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmt.format(tf.winRate)}%
                      </span>
                    </div>
                  </div>
                  <WinRateBar winRate={tf.winRate} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* DOL + Model Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* DOL */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">DOL Performance</CardTitle>
            <CardDescription className="text-xs">Draw on Liquidity breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.dolAnalytics.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">No DOL data yet</p>
            ) : (
              stats.dolAnalytics.map((d) => (
                <div key={d.dol} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{d.dol}</span>
                      <span className="text-[10px] text-muted-foreground">{d.total} trades</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono ${d.totalRR >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {d.totalRR >= 0 ? "+" : ""}{fmt.format(d.totalRR)}R
                      </span>
                      <span className={`text-xs font-bold ${d.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmt.format(d.winRate)}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar
                    value={d.winRate}
                    max={100}
                    color={d.winRate >= 50 ? "oklch(0.70 0.175 175)" : "oklch(0.60 0.22 25)"}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Models */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Model Performance</CardTitle>
            <CardDescription className="text-xs">Setup model breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.modelAnalytics.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">No model data yet</p>
            ) : (
              stats.modelAnalytics.map((m) => (
                <div key={m.model} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{m.model}</span>
                      <span className="text-[10px] text-muted-foreground">{m.total} trades</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono ${m.totalRR >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {m.totalRR >= 0 ? "+" : ""}{fmt.format(m.totalRR)}R
                      </span>
                      <span className={`text-xs font-bold ${m.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmt.format(m.winRate)}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar
                    value={m.winRate}
                    max={100}
                    color={m.winRate >= 50 ? "oklch(0.70 0.175 175)" : "oklch(0.60 0.22 25)"}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
