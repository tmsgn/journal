"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Trade } from "@/hooks/use-journal";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Star,
  BarChart2,
  Pencil,
  X,
  ImageIcon,
  Brain,
  MessageSquare,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        className="w-full rounded-lg border border-border/60 object-cover max-h-48 cursor-zoom-in hover:max-h-none transition-all duration-300"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

interface TradeDetailSheetProps {
  trade: Trade | null;
  open: boolean;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
}

export function TradeDetailSheet({
  trade,
  open,
  onClose,
  onEdit,
}: TradeDetailSheetProps) {
  if (!trade) return null;

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
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] overflow-y-auto flex flex-col gap-0 p-0 border-l border-border/60"
      >
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/60 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <SheetTitle className="text-base font-bold">
                Trade Review
              </SheetTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <OutcomeBadge outcome={trade.outcome} />
                <span className="text-xs text-muted-foreground font-mono">
                  {trade.tradeDate}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => {
                  onEdit(trade);
                  onClose();
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">
          {/* RR Hero */}
          <div
            className={cn(
              "rounded-xl border px-5 py-4 flex items-center justify-between",
              trade.outcome === "win"
                ? "border-emerald-500/20 bg-emerald-500/5"
                : trade.outcome === "loss"
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-yellow-500/20 bg-yellow-500/5",
            )}
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Risk / Reward
              </p>
              <p
                className={cn(
                  "text-3xl font-bold font-mono tracking-tight",
                  rrColor,
                )}
              >
                {rrSign}
                {numberFormatter.format(trade.rr)}R
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Rating
              </p>
              <p className="text-2xl font-bold text-primary">{trade.rating}</p>
            </div>
          </div>

          {/* Trade meta */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
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
          </div>

          <Separator className="opacity-50" />

          {/* Reason */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Why I Took It
              </p>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 rounded-lg bg-muted/50 px-4 py-3 border border-border/40">
              {trade.reason || (
                <span className="text-muted-foreground italic">No notes</span>
              )}
            </p>
          </div>

          {/* Emotions */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Emotions & Psychology
              </p>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 rounded-lg bg-muted/50 px-4 py-3 border border-border/40">
              {trade.emotions || (
                <span className="text-muted-foreground italic">No notes</span>
              )}
            </p>
          </div>

          {/* Screenshots */}
          {hasScreenshots && (
            <>
              <Separator className="opacity-50" />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Screenshots
                  </p>
                </div>
                <ScreenshotPreview
                  url={trade.screenshotHigh}
                  label="High Timeframe"
                />
                <ScreenshotPreview
                  url={trade.screenshotMiddle}
                  label="Middle Timeframe"
                />
                <ScreenshotPreview
                  url={trade.screenshotLow}
                  label="Low Timeframe (Entry)"
                />
              </div>
            </>
          )}

          {/* Metadata footer */}
          <Separator className="opacity-50" />
          <p className="text-[10px] text-muted-foreground/50 pb-2">
            Logged {new Date(trade.createdAt).toLocaleString()} · ID{" "}
            {trade.id.slice(0, 8)}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
