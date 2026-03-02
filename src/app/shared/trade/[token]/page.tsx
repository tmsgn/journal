"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { type Trade, rowToTrade } from "@/hooks/use-journal";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Star,
  BarChart2,
  Brain,
  MessageSquare,
  Minus,
  Target,
  Activity,
} from "lucide-react";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function OutcomeBadge({ outcome }: { outcome: Trade["outcome"] }) {
  if (outcome === "win")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs font-semibold gap-1.5 px-2.5 py-1">
        <TrendingUp className="h-3.5 w-3.5" /> WIN
      </Badge>
    );
  if (outcome === "loss")
    return (
      <Badge className="bg-red-500/15 text-red-500 border-red-500/30 text-xs font-semibold gap-1.5 px-2.5 py-1">
        <TrendingDown className="h-3.5 w-3.5" /> LOSS
      </Badge>
    );
  return (
    <Badge className="bg-yellow-500/15 text-yellow-500 border-yellow-500/30 text-xs font-semibold gap-1.5 px-2.5 py-1">
      <Minus className="h-3.5 w-3.5" /> BREAKEVEN
    </Badge>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

function ScreenshotPreview({ url, label }: { url?: string; label: string }) {
  if (!url) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="w-full rounded-lg border border-border/60 object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

export default function SharedSingleTradePage() {
  const params = useParams();
  const token = params.token as string;
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrade() {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("journal_trades")
        .select("*")
        .eq("share_token", token)
        .single();

      if (error || !data) {
        setError("Trade not found or link is invalid.");
      } else {
        setTrade(rowToTrade(data));
      }
      setLoading(false);
    }

    if (token) {
      fetchTrade();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-muted-foreground animate-pulse">
        <p>Loading shared trade...</p>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-red-400 font-semibold">{error}</p>
      </div>
    );
  }

  const rrSign =
    trade.outcome === "win" ? "+" : trade.outcome === "loss" ? "-" : "";
  const rrColor =
    trade.outcome === "win"
      ? "text-emerald-500"
      : trade.outcome === "loss"
        ? "text-red-500"
        : "text-yellow-500";

  const hasScreenshots =
    trade.screenshotLow || trade.screenshotMiddle || trade.screenshotHigh;

  return (
    <div className="min-h-screen bg-background/50 flex flex-col items-center justify-start p-4 md:p-12 overflow-y-auto">
      <Card className="w-full max-w-3xl border-border/60 bg-card/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="border-b border-border/60 px-6 py-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1.5">
              <CardTitle className="text-xl font-bold">Trade Review</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <OutcomeBadge outcome={trade.outcome} />
                <span className="text-sm text-muted-foreground font-mono">
                  {trade.tradeDate}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-8 space-y-8">
          {/* RR Hero */}
          <div
            className={cn(
              "rounded-xl border px-6 py-5 flex items-center justify-between shadow-sm",
              trade.outcome === "win"
                ? "border-emerald-500/20 bg-emerald-500/5"
                : trade.outcome === "loss"
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-yellow-500/20 bg-yellow-500/5",
            )}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Risk / Reward
              </p>
              <p
                className={cn(
                  "text-4xl font-bold font-mono tracking-tight",
                  rrColor,
                )}
              >
                {rrSign}
                {numberFormatter.format(trade.rr)}R
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Rating
              </p>
              <p className="text-3xl font-bold text-primary">{trade.rating}</p>
            </div>
          </div>

          {/* Trade meta */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-6">
            <MetaItem icon={Calendar} label="Date" value={trade.tradeDate} />
            <MetaItem
              icon={Clock}
              label="Entry Timeframe"
              value={trade.entryTimeframe}
            />
            {trade.po3Time && (
              <MetaItem
                icon={BarChart2}
                label="PO3 Time"
                value={trade.po3Time}
              />
            )}
            <MetaItem icon={Star} label="Setup Rating" value={trade.rating} />
            {trade.dol && trade.dol.length > 0 && (
              <MetaItem
                icon={Target}
                label="DOL"
                value={trade.dol.join(", ")}
              />
            )}
            {trade.model && trade.model.length > 0 && (
              <MetaItem
                icon={Activity}
                label="Models"
                value={trade.model.join(", ")}
              />
            )}
          </div>

          <Separator className="opacity-50" />

          {/* Notes */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Why I Took It
                </p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 rounded-lg bg-muted/50 px-4 py-3 border border-border/40 min-h-[100px] whitespace-pre-wrap">
                {trade.reason || (
                  <span className="text-muted-foreground italic">No notes</span>
                )}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Emotions & Psychology
                </p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 rounded-lg bg-muted/50 px-4 py-3 border border-border/40 min-h-[100px] whitespace-pre-wrap">
                {trade.emotions || (
                  <span className="text-muted-foreground italic">No notes</span>
                )}
              </p>
            </div>
          </div>

          {/* Screenshots */}
          {hasScreenshots && (
            <>
              <Separator className="opacity-50" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Screenshots
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ScreenshotPreview
                    url={trade.screenshotLow}
                    label="Low TF Entry"
                  />
                  <ScreenshotPreview
                    url={trade.screenshotMiddle}
                    label="Mid TF Context"
                  />
                  <ScreenshotPreview
                    url={trade.screenshotHigh}
                    label="High TF HTF"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-muted-foreground/50">
        iFVG Trading Journal • Shared Log
      </p>
    </div>
  );
}
