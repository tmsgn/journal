"use client";

import { useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Search,
  X,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScreenshotUploader } from "@/components/screenshot-uploader";
import { TradeDetailSheet } from "@/components/trade-detail-sheet";
import { toast } from "sonner";
import {
  outcomeOptions,
  sessionOptions,
  directionOptions,
  type Trade,
  type TradeFormValues,
  tradeSchema,
  useJournal,
  tradesToCsv,
} from "@/hooks/use-journal";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const fmtPnl = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

type TradeFormInput = z.input<typeof tradeSchema>;
type SortKey = "tradeDate" | "entryTimeframe" | "rating" | "rr" | "outcome";
type SortDir = "asc" | "desc";

const sessionLabels: Record<string, string> = {
  london: "London",
  "new-york": "New York",
  asian: "Asian",
  "london-close": "LDN Close",
};

function SortIcon({ col, active, dir }: { col: string; active: SortKey; dir: SortDir }) {
  if (active !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-25" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3 w-3 ml-1 text-primary" />
  ) : (
    <ArrowDown className="h-3 w-3 ml-1 text-primary" />
  );
}

function SortHeader({ col, label, active, dir, onClick }: { col: SortKey; label: string; active: SortKey; dir: SortDir; onClick: (c: SortKey) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(col)}
      className="flex items-center text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      <SortIcon col={col} active={active} dir={dir} />
    </button>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  if (outcome === "win")
    return <Badge className="bg-emerald-500/12 text-emerald-400 border-emerald-500/20 text-[10px] font-semibold gap-1"><TrendingUp className="h-2.5 w-2.5" />WIN</Badge>;
  if (outcome === "loss")
    return <Badge className="bg-red-500/12 text-red-400 border-red-500/20 text-[10px] font-semibold gap-1"><TrendingDown className="h-2.5 w-2.5" />LOSS</Badge>;
  return <Badge className="bg-yellow-500/12 text-yellow-400 border-yellow-500/20 text-[10px] font-semibold">BE</Badge>;
}

function DirectionBadge({ direction }: { direction?: string }) {
  if (!direction) return null;
  return direction === "long" ? (
    <span className="badge-long inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
      <ArrowUpRight className="h-2.5 w-2.5" />L
    </span>
  ) : (
    <span className="badge-short inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
      <ArrowDownRight className="h-2.5 w-2.5" />S
    </span>
  );
}

function EditTradeDialog({ trade, open, onClose }: { trade: Trade; open: boolean; onClose: () => void }) {
  const { updateTrade, userId } = useJournal();
  const { settings } = useSettings();

  const form = useForm<TradeFormInput, unknown, TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      tradeDate: trade.tradeDate,
      entryTimeframe: trade.entryTimeframe,
      po3Time: trade.po3Time,
      rating: trade.rating,
      rr: trade.rr,
      outcome: trade.outcome,
      direction: trade.direction ?? "long",
      session: trade.session ?? "new-york",
      pnl: trade.pnl,
      dol: trade.dol || [],
      model: trade.model || [],
      reason: trade.reason,
      emotions: trade.emotions,
      screenshotLow: trade.screenshotLow ?? "",
      screenshotMiddle: trade.screenshotMiddle ?? "",
      screenshotHigh: trade.screenshotHigh ?? "",
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const watchOutcome = form.watch("outcome");
  const watchDirection = form.watch("direction");

  const onSubmit = async (values: TradeFormValues) => {
    setIsSaving(true);
    const { error } = await updateTrade(trade.id, values);
    setIsSaving(false);
    if (error) {
      toast.error(`Failed to update: ${error}`);
    } else {
      toast.success("Trade updated!");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Trade</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Modify your trade entry.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <FormField control={form.control} name="tradeDate" render={({ field }) => (
              <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="entryTimeframe" render={({ field }) => (
              <FormItem>
                <FormLabel>Timeframe</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{settings.timeframes.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Direction toggle */}
            <FormField control={form.control} name="direction" render={({ field }) => (
              <FormItem>
                <FormLabel>Direction</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    {(["long", "short"] as const).map((d) => (
                      <button key={d} type="button" onClick={() => field.onChange(d)}
                        className={cn("flex-1 h-9 rounded-lg border text-sm font-semibold capitalize transition-all",
                          watchDirection === d
                            ? d === "long" ? "badge-long border-2" : "badge-short border-2"
                            : "border-border/50 text-muted-foreground"
                        )}>
                        {d === "long" ? "↑ Long" : "↓ Short"}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Session */}
            <FormField control={form.control} name="session" render={({ field }) => (
              <FormItem>
                <FormLabel>Session</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {sessionOptions.map((o) => (
                      <SelectItem key={o} value={o}>{sessionLabels[o] ?? o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="po3Time" render={({ field }) => (
              <FormItem>
                <FormLabel>PO3 Time <span className="text-muted-foreground font-normal">(opt)</span></FormLabel>
                <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Not applicable" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not applicable</SelectItem>
                    {settings.po3Times.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="rating" render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{settings.ratings.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="rr" render={({ field }) => (
              <FormItem>
                <FormLabel>RR</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0}
                    value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                    onChange={(e) => field.onChange(e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="pnl" render={({ field }) => (
              <FormItem>
                <FormLabel>P&L ($) <span className="text-muted-foreground font-normal">(opt)</span></FormLabel>
                <FormControl>
                  <Input type="number" step="1" placeholder="e.g. 350"
                    value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Outcome */}
            <FormField control={form.control} name="outcome" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Outcome</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    {(["win", "loss", "breakeven"] as const).map((o) => (
                      <button key={o} type="button" onClick={() => field.onChange(o)}
                        className={cn("flex-1 h-9 rounded-lg border text-sm font-semibold capitalize transition-all",
                          watchOutcome === o
                            ? o === "win" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
                              : o === "loss" ? "bg-red-500/15 text-red-400 border-red-500/40"
                              : "bg-yellow-500/15 text-yellow-400 border-yellow-500/40"
                            : "border-border/50 text-muted-foreground"
                        )}>
                        {o}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* DOL + Model */}
            <FormField control={form.control} name="dol" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Draw on Liquidity</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {settings.dols.map((d) => {
                      const sel = field.value.includes(d);
                      return (
                        <Badge key={d} variant={sel ? "default" : "outline"} className="cursor-pointer"
                          onClick={() => field.onChange(sel ? field.value.filter((v: string) => v !== d) : [...field.value, d])}>
                          {d}
                        </Badge>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="model" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Model(s)</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {settings.models.map((m) => {
                      const sel = field.value.includes(m);
                      return (
                        <Badge key={m} variant={sel ? "default" : "outline"} className="cursor-pointer"
                          onClick={() => field.onChange(sel ? field.value.filter((v: string) => v !== m) : [...field.value, m])}>
                          {m}
                        </Badge>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Why I Took It</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="emotions" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Emotions</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="screenshotLow" render={({ field }) => (
              <FormItem><ScreenshotUploader label="Low TF Screenshot" value={field.value} onChange={field.onChange} userId={userId} /></FormItem>
            )} />
            <FormField control={form.control} name="screenshotMiddle" render={({ field }) => (
              <FormItem><ScreenshotUploader label="Middle TF Screenshot" value={field.value} onChange={field.onChange} userId={userId} /></FormItem>
            )} />
            <FormField control={form.control} name="screenshotHigh" render={({ field }) => (
              <FormItem className="md:col-span-2"><ScreenshotUploader label="High TF Screenshot" value={field.value} onChange={field.onChange} userId={userId} /></FormItem>
            )} />
            <DialogFooter className="md:col-span-2 gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
              <Button type="submit" className="gap-2" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function TradesPage() {
  const { trades, deleteTrade } = useJournal();
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [viewTrade, setViewTrade] = useState<Trade | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState<string>("all");
  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [filterSession, setFilterSession] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("tradeDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (col: SortKey) => {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = trades.filter((t) =>
      t.tradeDate.includes(q) ||
      t.entryTimeframe.toLowerCase().includes(q) ||
      t.rating.toLowerCase().includes(q) ||
      t.outcome.includes(q) ||
      t.reason.toLowerCase().includes(q) ||
      (t.po3Time ?? "").includes(q),
    );
    if (filterOutcome !== "all") result = result.filter((t) => t.outcome === filterOutcome);
    if (filterDirection !== "all") result = result.filter((t) => t.direction === filterDirection);
    if (filterSession !== "all") result = result.filter((t) => t.session === filterSession);
    result = [...result].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [trades, search, sortKey, sortDir, filterOutcome, filterDirection, filterSession]);

  const exportCsv = () => {
    const csv = tradesToCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nq-trades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = filterOutcome !== "all" || filterDirection !== "all" || filterSession !== "all";

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-8 journal-bg min-h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">All Trades</h1>
          <p className="text-muted-foreground text-sm">{trades.length} total trade{trades.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={exportCsv} disabled={trades.length === 0}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Trade Log</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}{search ? ` for "${search}"` : ""}
              </CardDescription>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search trades…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-8 h-8 text-xs bg-background/50"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Filter:</span>
            </div>
            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="h-7 text-[11px] w-28 border-border/50">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                {outcomeOptions.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterDirection} onValueChange={setFilterDirection}>
              <SelectTrigger className="h-7 text-[11px] w-28 border-border/50">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Both sides</SelectItem>
                {directionOptions.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSession} onValueChange={setFilterSession}>
              <SelectTrigger className="h-7 text-[11px] w-32 border-border/50">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sessions</SelectItem>
                {sessionOptions.map((o) => <SelectItem key={o} value={o}>{sessionLabels[o] ?? o}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-muted-foreground"
                onClick={() => { setFilterOutcome("all"); setFilterDirection("all"); setFilterSession("all"); }}>
                Clear
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 pb-1">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="pl-6"><SortHeader col="tradeDate" label="Date" active={sortKey} dir={sortDir} onClick={handleSort} /></TableHead>
                  <TableHead><SortHeader col="entryTimeframe" label="TF" active={sortKey} dir={sortDir} onClick={handleSort} /></TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground">Dir</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground">Session</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground">DOL</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground">Model</TableHead>
                  <TableHead><SortHeader col="rating" label="Rating" active={sortKey} dir={sortDir} onClick={handleSort} /></TableHead>
                  <TableHead><SortHeader col="rr" label="RR" active={sortKey} dir={sortDir} onClick={handleSort} /></TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground">P&L</TableHead>
                  <TableHead><SortHeader col="outcome" label="Outcome" active={sortKey} dir={sortDir} onClick={handleSort} /></TableHead>
                  <TableHead className="pr-6 text-right text-[11px] font-medium text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-muted-foreground text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm">{search || hasFilters ? "No trades match the filters." : "No trades yet."}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((trade) => (
                    <TableRow
                      key={trade.id}
                      onClick={() => setViewTrade(trade)}
                      className="border-border/20 hover:bg-primary/4 transition-colors group cursor-pointer"
                    >
                      <TableCell className="pl-6 font-mono text-xs text-muted-foreground">{trade.tradeDate}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[10px]">{trade.entryTimeframe}</Badge>
                      </TableCell>
                      <TableCell>
                        <DirectionBadge direction={trade.direction} />
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground capitalize">
                        {sessionLabels[trade.session ?? ""] ?? trade.session ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-28">
                          {trade.dol?.map((d) => (
                            <Badge key={d} variant="secondary" className="font-mono text-[9px] py-0 px-1">{d}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-28">
                          {trade.model?.map((m) => (
                            <Badge key={m} variant="secondary" className="font-mono text-[9px] py-0 px-1">{m}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-bold text-primary">{trade.rating}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold">{numberFormatter.format(trade.rr)}R</TableCell>
                      <TableCell>
                        {trade.pnl != null ? (
                          <span className={`text-[11px] font-mono font-semibold ${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {fmtPnl.format(trade.pnl)}
                          </span>
                        ) : <span className="text-muted-foreground/40 text-[10px]">—</span>}
                      </TableCell>
                      <TableCell>
                        <OutcomeBadge outcome={trade.outcome} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={(e) => { e.stopPropagation(); setEditTrade(trade); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                            onClick={(e) => { e.stopPropagation(); setDeleteId(trade.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/30">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                {search || hasFilters ? "No trades match the filters." : "No trades yet."}
              </div>
            ) : (
              filtered.map((trade) => (
                <button
                  key={trade.id}
                  type="button"
                  onClick={() => setViewTrade(trade)}
                  className="w-full flex items-start gap-3 px-4 py-4 hover:bg-primary/4 transition-colors text-left"
                >
                  <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${trade.outcome === "win" ? "bg-emerald-500" : trade.outcome === "loss" ? "bg-red-500" : "bg-yellow-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{trade.tradeDate}</span>
                      <Badge variant="secondary" className="font-mono text-[9px] py-0">{trade.entryTimeframe}</Badge>
                      <DirectionBadge direction={trade.direction} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{trade.rating}</span>
                      <span className="text-[10px] text-muted-foreground">{sessionLabels[trade.session ?? ""] ?? ""}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{trade.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-bold">{numberFormatter.format(trade.rr)}R</p>
                    {trade.pnl != null && (
                      <p className={`text-[10px] font-mono ${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPnl.format(trade.pnl)}</p>
                    )}
                    <OutcomeBadge outcome={trade.outcome} />
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {editTrade && (
        <EditTradeDialog trade={editTrade} open={!!editTrade} onClose={() => setEditTrade(null)} />
      )}
      <TradeDetailSheet
        trade={viewTrade}
        open={!!viewTrade}
        onClose={() => setViewTrade(null)}
        onEdit={(t) => { setViewTrade(null); setEditTrade(t); }}
      />
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trade?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteId) { await deleteTrade(deleteId); setDeleteId(null); }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
