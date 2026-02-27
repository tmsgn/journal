"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface EquityCurveChartProps {
  data: { date: string; rr: number }[];
}

// biome-ignore lint: any is fine for recharts custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  const color = val >= 0 ? "text-emerald-400" : "text-red-400";
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 px-3 py-2 shadow-xl text-xs backdrop-blur-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className={`font-bold ${color}`}>
        {val >= 0 ? "+" : ""}
        {val}R cumulative
      </p>
    </div>
  );
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  if (data.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Need at least 2 trades to display equity curve
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.rr));
  const minVal = Math.min(...data.map((d) => d.rr));
  const isPositive = data[data.length - 1]?.rr >= 0;
  const lineColor = isPositive ? "oklch(0.72 0.18 172)" : "oklch(0.62 0.22 25)";

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart
        data={data}
        margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
      >
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={
                isPositive ? "oklch(0.72 0.18 172)" : "oklch(0.62 0.22 25)"
              }
              stopOpacity={0.2}
            />
            <stop offset="95%" stopColor="transparent" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="4 4"
          strokeOpacity={0.5}
        />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          domain={[minVal - 0.5, maxVal + 0.5]}
          tickFormatter={(v) => `${v}R`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={0}
          stroke="var(--border)"
          strokeWidth={1.5}
          strokeDasharray="6 3"
        />
        <Line
          type="monotone"
          dataKey="rr"
          stroke={lineColor}
          strokeWidth={2.5}
          dot={false}
          activeDot={{
            r: 5,
            fill: lineColor,
            stroke: "var(--background)",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
