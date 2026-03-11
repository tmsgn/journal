"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useJournal } from "@/hooks/use-journal";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  BarChart2,
  Zap,
  ShieldAlert,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Trophy,
  CircleDot,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const fmtPnl = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  accent?: string;
}) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-red-400"
        : "text-foreground";

  return (
    <Card className="stat-card-glow relative overflow-hidden border-border/60 bg-card transition-all duration-200 hover:border-primary/20 group">
      <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-transparent to-transparent pointer-events-none" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ?? "bg-primary/10"} ring-1 ring-primary/15`}
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
        <p className={`text-2xl font-bold tracking-tight font-trading ${trendColor}`}>
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  if (outcome === "win")
    return (
      <Badge className="bg-emerald-500/12 text-emerald-500 border-emerald-500/20 text-[10px] font-semibold gap-1">
        <TrendingUp className="h-2.5 w-2.5" /> WIN
      </Badge>
    );
  if (outcome === "loss")
    return (
      <Badge className="bg-red-500/12 text-red-400 border-red-500/20 text-[10px] font-semibold gap-1">
        <TrendingDown className="h-2.5 w-2.5" /> LOSS
      </Badge>
    );
  return (
    <Badge className="bg-yellow-500/12 text-yellow-400 border-yellow-500/20 text-[10px] font-semibold">
      BE
    </Badge>
  );
}

function DirectionBadge({ direction }: { direction?: string }) {
  if (!direction) return null;
  return direction === "long" ? (
    <span className="badge-long inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
      <ArrowUpRight className="h-2.5 w-2.5" />
      Long
    </span>
  ) : (
    <span className="badge-short inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
      <ArrowDownRight className="h-2.5 w-2.5" />
      Short
    </span>
  );
}

// Custom tooltip for equity curve
function EquityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 backdrop-blur-sm px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className={p.value >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
          {p.value >= 0 ? "+" : ""}{fmt.format(p.value)}R
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { trades, stats, hydrated } = useJournal();

  const recentTrades = useMemo(() => trades.slice(0, 10), [trades]);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="h-8 w-56 rounded-lg bg-muted animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const rrSign = stats.totalRR >= 0 ? "+" : "";
  const streakLabel =
    stats.streak > 0 && stats.streakType
      ? `${stats.streak} ${stats.streakType} streak`
      : "No streak";

  const streakIcon =
    stats.streakType === "win" ? (
      <Flame className="h-3.5 w-3.5 text-amber-400" />
    ) : stats.streakType === "loss" ? (
      <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
    ) : (
      <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
    );

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 journal-bg min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            NQ Futures · iFVG Inversion Strategy
          </p>
        </div>
        <Button asChild size="sm" className="gap-2 shadow-sm">
          <Link href="/new-trade">
            <Activity className="h-3.5 w-3.5" />
            Log Trade
          </Link>
        </Button>
      </div>

      {/* 6 Primary Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Trades"
          value={stats.total}
          sub={`${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE`}
          icon={BarChart2}
          trend="neutral"
        />
        <StatCard
          label="Win Rate"
          value={`${fmt.format(stats.winRate)}%`}
          sub="Excl. breakevens"
          icon={Target}
          trend={stats.winRate >= 50 ? "up" : "down"}
        />
        <StatCard
          label="Profit Factor"
          value={stats.profitFactor >= 999 ? "∞" : fmt.format(stats.profitFactor)}
          sub={`≥1.5 is good`}
          icon={Zap}
          trend={stats.profitFactor >= 1.5 ? "up" : stats.profitFactor >= 1 ? "neutral" : "down"}
        />
        <StatCard
          label="Expectancy"
          value={`${stats.expectancy >= 0 ? "+" : ""}${fmt.format(stats.expectancy)}R`}
          sub="Per trade edge"
          icon={TrendingUp}
          trend={stats.expectancy > 0 ? "up" : "down"}
        />
        <StatCard
          label="Net Profit"
          value={`${rrSign}${fmt.format(stats.totalRR)}R`}
          sub={stats.totalPnL !== 0 ? fmtPnl.format(stats.totalPnL) : "All-time RR"}
          icon={DollarSign}
          trend={stats.totalRR >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Max Drawdown"
          value={`${fmt.format(stats.maxDrawdown)}R`}
          sub="Peak-to-trough"
          icon={ShieldAlert}
          trend={stats.maxDrawdown < 3 ? "up" : "down"}
        />
      </div>

      {/* Secondary metrics row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Avg RR</p>
            <p className={`text-sm font-bold font-trading ${stats.avgRR > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
              {stats.avgRR >= 0 ? "+" : ""}{fmt.format(stats.avgRR)}R
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Best Trade</p>
            <p className="text-sm font-bold font-trading text-amber-400">+{fmt.format(stats.largestWin)}R</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            {streakIcon}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Streak</p>
            <p className="text-sm font-bold capitalize">{streakLabel}</p>
          </div>
        </div>
      </div>

      {/* Equity Curve + Models */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Equity Curve */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Equity Curve</CardTitle>
                <CardDescription className="text-xs mt-0.5">Cumulative R — all trades</CardDescription>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold font-trading ${stats.totalRR >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {rrSign}{fmt.format(stats.totalRR)}R
                </p>
                <p className="text-[10px] text-muted-foreground">{stats.total} trades</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {stats.equityCurve.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.equityCurve} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickFormatter={(v: number) => `${v}R`}
                  />
                  <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
                  <Tooltip content={<EquityTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rr"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#rrGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--chart-1)", strokeWidth: 2, stroke: "var(--card)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-55 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Log at least 2 trades to see curve</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Models Playbook */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Models Playbook</CardTitle>
            <CardDescription className="text-xs">Performance by setup model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.modelAnalytics.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">No models used yet</p>
            ) : (
              stats.modelAnalytics.map((m) => (
                <div key={m.model} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{m.model}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${m.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmt.format(m.winRate)}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">{m.total}t</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(m.winRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Recent Trades</CardTitle>
            <CardDescription className="text-xs mt-0.5">Latest 10 entries</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs text-muted-foreground hover:text-primary"
          >
            <Link href="/trades">View all →</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {recentTrades.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <BarChart2 className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No trades yet</p>
              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link href="/new-trade">Log your first trade</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    {["Date", "TF", "Direction", "Session", "RR", "Rating", "Outcome"].map((h) => (
                      <th key={h} className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 first:pl-6 last:pr-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade) => (
                    <tr key={trade.id} className="border-b border-border/20 hover:bg-primary/4 transition-colors">
                      <td className="pl-6 py-3 font-mono text-xs text-muted-foreground">{trade.tradeDate}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="font-mono text-[10px]">{trade.entryTimeframe}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DirectionBadge direction={trade.direction} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-muted-foreground capitalize">{trade.session?.replace("-", " ")}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{fmt.format(trade.rr)}R</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-primary">{trade.rating}</span>
                      </td>
                      <td className="pr-6 py-3">
                        <OutcomeBadge outcome={trade.outcome} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
