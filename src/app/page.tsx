"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useJournal } from "@/hooks/use-journal";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Flame,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const timeframeChartConfig = {
  winRate: {
    label: "Win Rate",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-red-400"
        : "text-foreground";

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </CardDescription>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <CardTitle
          className={`text-3xl font-bold tracking-tight ${trendColor}`}
        >
          {value}
        </CardTitle>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardHeader>
    </Card>
  );
}

export default function DashboardPage() {
  const { trades, stats, hydrated } = useJournal();

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const recentTrades = trades.slice(0, 8);
  const rrSign = stats.totalRR >= 0 ? "+" : "";
  const streakLabel =
    stats.streak > 0 && stats.streakType
      ? `${stats.streak} ${stats.streakType} streak`
      : "No streak";

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Performance overview — iFVG inversion strategy
          </p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/new-trade">
            <Activity className="h-4 w-4" />
            Log Trade
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Trades"
          value={stats.total}
          sub={`${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE`}
          icon={BarChart2}
          trend="neutral"
        />
        <StatCard
          label="Win Rate"
          value={`${numberFormatter.format(stats.winRate)}%`}
          sub="Overall win %"
          icon={Target}
          trend={stats.winRate >= 50 ? "up" : "down"}
        />
        <StatCard
          label="Average RR"
          value={numberFormatter.format(stats.avgRR)}
          sub="Avg risk-reward"
          icon={TrendingUp}
          trend={stats.avgRR >= 1 ? "up" : "down"}
        />
        <StatCard
          label="Net RR"
          value={`${rrSign}${numberFormatter.format(stats.totalRR)}`}
          sub={streakLabel}
          icon={Flame}
          trend={stats.totalRR >= 0 ? "up" : "down"}
        />
      </div>

      {/* Playbook / Analytics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Win Rate by Timeframe
            </CardTitle>
            <CardDescription className="text-xs">
              30sec → 5min inversion entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={timeframeChartConfig}
              className="h-64 w-full"
            >
              <BarChart data={stats.winRateByTimeframe} barSize={32}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="timeframe"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "var(--primary)", fillOpacity: 0.05 }}
                />
                <Bar
                  dataKey="winRate"
                  radius={[6, 6, 0, 0]}
                  fill="var(--color-winRate)"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Playbook: Models */}
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Models Playbook
            </CardTitle>
            <CardDescription className="text-xs">
              Performance by Setup Model
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="pl-6 text-xs text-muted-foreground w-full">
                    Model
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">
                    Win%
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">
                    RR
                  </TableHead>
                  <TableHead className="pr-6 text-xs text-muted-foreground text-right w-16">
                    #
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.modelAnalytics.map((m) => (
                  <TableRow
                    key={m.model}
                    className="border-border/40 hover:bg-primary/5"
                  >
                    <TableCell className="pl-6 font-semibold text-xs whitespace-nowrap">
                      {m.model}
                    </TableCell>
                    <TableCell
                      className={`text-right text-xs font-mono font-medium ${m.winRate >= 50 ? "text-emerald-500" : "text-muted-foreground"}`}
                    >
                      {numberFormatter.format(m.winRate)}%
                    </TableCell>
                    <TableCell
                      className={`text-right text-xs font-mono font-bold ${m.totalRR > 0 ? "text-emerald-500" : m.totalRR < 0 ? "text-red-500" : ""}`}
                    >
                      {m.totalRR > 0 ? "+" : ""}
                      {numberFormatter.format(m.totalRR)}R
                    </TableCell>
                    <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                      {m.total}
                    </TableCell>
                  </TableRow>
                ))}
                {stats.modelAnalytics.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-xs text-muted-foreground italic border-0"
                    >
                      No models used yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Playbook: DOLs */}
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              DOL Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Draw on Liquidity edge
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="pl-6 text-xs text-muted-foreground w-full">
                    Liquidity
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">
                    Win%
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">
                    RR
                  </TableHead>
                  <TableHead className="pr-6 text-xs text-muted-foreground text-right w-16">
                    #
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.dolAnalytics.map((d) => (
                  <TableRow
                    key={d.dol}
                    className="border-border/40 hover:bg-primary/5"
                  >
                    <TableCell className="pl-6 font-semibold text-xs whitespace-nowrap">
                      {d.dol}
                    </TableCell>
                    <TableCell
                      className={`text-right text-xs font-mono font-medium ${d.winRate >= 50 ? "text-emerald-500" : "text-muted-foreground"}`}
                    >
                      {numberFormatter.format(d.winRate)}%
                    </TableCell>
                    <TableCell
                      className={`text-right text-xs font-mono font-bold ${d.totalRR > 0 ? "text-emerald-500" : d.totalRR < 0 ? "text-red-500" : ""}`}
                    >
                      {d.totalRR > 0 ? "+" : ""}
                      {numberFormatter.format(d.totalRR)}R
                    </TableCell>
                    <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                      {d.total}
                    </TableCell>
                  </TableRow>
                ))}
                {stats.dolAnalytics.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-xs text-muted-foreground italic border-0"
                    >
                      No DOLs used yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Equity Curve */}
      <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Equity Curve
          </CardTitle>
          <CardDescription className="text-xs">
            Cumulative RR over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EquityCurveChart data={stats.equityCurve} />
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Recent Trades
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Latest 8 entries
            </CardDescription>
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
        <CardContent className="p-0 pb-1">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="pl-6 text-xs font-medium text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  TF
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  PO3
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Rating
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  RR
                </TableHead>
                <TableHead className="pr-6 text-xs font-medium text-muted-foreground">
                  Outcome
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTrades.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground text-center py-12"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <BarChart2 className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm">No trades yet</p>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="mt-1 text-xs"
                      >
                        <Link href="/new-trade">Add your first trade</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentTrades.map((trade) => (
                  <TableRow
                    key={trade.id}
                    className="border-border/40 hover:bg-primary/5 transition-colors"
                  >
                    <TableCell className="pl-6 font-mono text-xs">
                      {trade.tradeDate}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="font-mono text-[11px]"
                      >
                        {trade.entryTimeframe}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {trade.po3Time}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-primary">
                        {trade.rating}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold">
                      {numberFormatter.format(trade.rr)}R
                    </TableCell>
                    <TableCell className="pr-6">
                      {trade.outcome === "win" ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[11px] font-semibold">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          WIN
                        </Badge>
                      ) : trade.outcome === "loss" ? (
                        <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[11px] font-semibold">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          LOSS
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/25 text-[11px] font-semibold">
                          BE
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
