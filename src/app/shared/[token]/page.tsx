"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { type Trade, rowToTrade } from "@/hooks/use-journal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function SharedJournalPage() {
  const params = useParams();
  const token = params.token as string;
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedTrades() {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // Look up public user settings by the share token
      const { data: settings, error: settingsError } = await supabase
        .from("user_settings")
        .select("user_id, is_public")
        .eq("share_token", token)
        .single();

      if (settingsError || !settings || !settings.is_public) {
        setError("This journal is not available or is private.");
        setLoading(false);
        return;
      }

      // Fetch the trades since they're publicly accessible via RLS linking
      const { data: tradesData, error: tradesError } = await supabase
        .from("journal_trades")
        .select("*")
        .eq("user_id", settings.user_id)
        .order("trade_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (tradesError) {
        setError("Failed to load journal properties.");
      } else if (tradesData) {
        setTrades(tradesData.map(rowToTrade));
      }
      setLoading(false);
    }

    if (token) {
      fetchSharedTrades();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-muted-foreground animate-pulse">
        <p>Loading journal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <p className="text-red-400 font-semibold">{error}</p>
      </div>
    );
  }

  // Summary stats
  const wins = trades.filter((t) => t.outcome === "win");
  const losses = trades.filter((t) => t.outcome === "loss");
  const nonBE = wins.length + losses.length;
  const winRate = nonBE > 0 ? (wins.length / nonBE) * 100 : 0;
  const netRR = trades.reduce((acc, t) => {
    if (t.outcome === "win") return acc + Number(t.rr);
    if (t.outcome === "loss") return acc - Math.max(Number(t.rr), 1);
    return acc;
  }, 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div className="space-y-1 mt-4">
        <h1 className="text-2xl font-bold tracking-tight">Shared Journal</h1>
        <p className="text-sm text-muted-foreground">
          You are viewing a shared journal connection.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Trades
            </p>
            <p className="text-2xl font-bold mt-1">{trades.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Win Rate
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}
            >
              {winRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Net RR
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${netRR >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {netRR >= 0 ? "+" : ""}
              {netRR.toFixed(2)}R
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              W/L/BE
            </p>
            <p className="text-2xl font-bold mt-1 text-foreground">
              {wins.length} / {losses.length} / {trades.length - nonBE}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/80 backdrop-blur-sm mt-4">
        <CardHeader>
          <CardTitle>Trade Log</CardTitle>
          <CardDescription>
            Read-only review log for historical setups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>RR</TableHead>
                  <TableHead>Setup</TableHead>
                  <TableHead>DOL</TableHead>
                  <TableHead>Models</TableHead>
                  <TableHead className="w-1/3">Reason / Play</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No public trades logged yet
                    </TableCell>
                  </TableRow>
                ) : (
                  trades.map((t) => (
                    <TableRow key={t.id} className="hover:bg-primary/5">
                      <TableCell className="font-mono text-xs">
                        {t.tradeDate}
                      </TableCell>
                      <TableCell>
                        {t.outcome === "win" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-semibold py-0 text-[10px]">
                            WIN
                          </Badge>
                        ) : t.outcome === "loss" ? (
                          <Badge className="bg-red-500/15 text-red-500 border-red-500/30 font-semibold py-0 text-[10px]">
                            LOSS
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/15 text-yellow-500 border-yellow-500/30 font-semibold py-0 text-[10px]">
                            BE
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className={`font-mono text-xs font-bold ${t.outcome === "win" ? "text-emerald-400" : t.outcome === "loss" ? "text-red-400" : ""}`}
                      >
                        {t.outcome === "win"
                          ? "+"
                          : t.outcome === "loss"
                            ? "-"
                            : ""}
                        {t.rr.toFixed(2)}R
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">{t.rating}</span>
                          <span className="text-muted-foreground text-[10px]">
                            {t.entryTimeframe}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {t.dol && t.dol.length > 0 ? (
                          <div className="text-xs text-muted-foreground">
                            {t.dol.join(", ")}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {t.model && t.model.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {t.model.map((m) => (
                              <Badge
                                key={m}
                                variant="secondary"
                                className="py-0 px-1 text-[9px]"
                              >
                                {m}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground line-clamp-3">
                        {t.reason}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
