"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ScreenshotUploader } from "@/components/screenshot-uploader";
import {
  getTodayDateString,
  outcomeOptions,
  sessionOptions,
  type TradeFormValues,
  tradeSchema,
  useJournal,
} from "@/hooks/use-journal";
import { useSettings } from "@/hooks/use-settings";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TradeFormInput = z.input<typeof tradeSchema>;

const sessionLabels: Record<string, string> = {
  london: "🇬🇧 London",
  "new-york": "🇺🇸 New York",
  asian: "🌏 Asian",
  "london-close": "🔔 London Close",
};

const defaultValues: TradeFormInput = {
  tradeDate: getTodayDateString(),
  entryTimeframe: "",
  po3Time: undefined,
  rating: "",
  dol: [],
  model: [],
  rr: 1,
  outcome: "win",
  direction: "long",
  session: "new-york",
  pnl: undefined,
  reason: "",
  emotions: "",
  screenshotLow: "",
  screenshotMiddle: "",
  screenshotHigh: "",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:col-span-2 pt-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-border/60" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap">
          {children}
        </p>
        <div className="h-px flex-1 bg-border/60" />
      </div>
    </div>
  );
}

export default function NewTradePage() {
  const { addTrade, hydrated: journalHydrated, userId } = useJournal();
  const { settings, hydrated: settingsHydrated } = useSettings();
  const hydrated = journalHydrated && settingsHydrated;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TradeFormInput, unknown, TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues,
  });

  const onSubmit = async (values: TradeFormValues) => {
    setIsSubmitting(true);
    const { error } = await addTrade(values);
    setIsSubmitting(false);
    if (error) {
      toast.error(`Failed to save trade: ${error}`);
    } else {
      toast.success("Trade saved!", {
        description: "Your journal entry has been added.",
      });
      form.reset({ ...defaultValues, tradeDate: getTodayDateString() });
    }
  };

  const watchOutcome = form.watch("outcome");
  const watchDirection = form.watch("direction");

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl journal-bg min-h-full">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight">Log Trade</h1>
        <p className="text-muted-foreground text-sm">
          Record your NQ Futures setup, execution, and psychology.
        </p>
      </div>

      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-4 border-b border-border/40">
          <CardTitle className="text-base font-semibold">New Journal Entry</CardTitle>
          <CardDescription className="text-xs">
            Date auto-fills today. All fields synced to Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-5 md:grid-cols-2"
            >
              <SectionLabel>Trade Setup</SectionLabel>

              {/* Date */}
              <FormField
                control={form.control}
                name="tradeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Entry Timeframe */}
              <FormField
                control={form.control}
                name="entryTimeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Entry Timeframe</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {settings.timeframes.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Direction */}
              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Direction</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => field.onChange("long")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border text-sm font-semibold transition-all",
                            watchDirection === "long"
                              ? "badge-long border-2"
                              : "border-border/50 text-muted-foreground hover:border-primary/30",
                          )}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                          Long
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("short")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border text-sm font-semibold transition-all",
                            watchDirection === "short"
                              ? "badge-short border-2"
                              : "border-border/50 text-muted-foreground hover:border-red-400/30",
                          )}
                        >
                          <ArrowDownRight className="h-4 w-4" />
                          Short
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Session */}
              <FormField
                control={form.control}
                name="session"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Session</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sessionOptions.map((o) => (
                          <SelectItem key={o} value={o}>{sessionLabels[o]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PO3 Time */}
              <FormField
                control={form.control}
                name="po3Time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      PO3 Time{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? undefined : v)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Not applicable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Not applicable</SelectItem>
                        {settings.po3Times.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rating */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Setup Rating</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {settings.ratings.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* RR */}
              <FormField
                control={form.control}
                name="rr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Risk-Reward (RR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="e.g. 2.5"
                        value={
                          typeof field.value === "number" ||
                          typeof field.value === "string"
                            ? field.value
                            : ""
                        }
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* P&L */}
              <FormField
                control={form.control}
                name="pnl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      P&L ($){" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="e.g. 350 or -120"
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Outcome */}
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-semibold">Outcome</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        {(["win", "loss", "breakeven"] as const).map((o) => (
                          <button
                            key={o}
                            type="button"
                            onClick={() => field.onChange(o)}
                            className={cn(
                              "flex-1 h-9 rounded-lg border text-sm font-semibold capitalize transition-all",
                              watchOutcome === o
                                ? o === "win"
                                  ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
                                  : o === "loss"
                                    ? "bg-red-500/15 text-red-400 border-red-500/40"
                                    : "bg-yellow-500/15 text-yellow-400 border-yellow-500/40"
                                : "border-border/50 text-muted-foreground hover:border-border",
                            )}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SectionLabel>Confluence Tags</SectionLabel>

              {/* DOL */}
              <FormField
                control={form.control}
                name="dol"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-semibold">Draw on Liquidity (DOL)</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {settings.dols.map((d) => {
                          const isSelected = field.value.includes(d);
                          return (
                            <Badge
                              key={d}
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer select-none transition-all"
                              onClick={() => {
                                const next = isSelected
                                  ? field.value.filter((v: string) => v !== d)
                                  : [...field.value, d];
                                field.onChange(next);
                              }}
                            >
                              {d}
                            </Badge>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Model */}
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-semibold">Model(s)</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {settings.models.map((m) => {
                          const isSelected = field.value.includes(m);
                          return (
                            <Badge
                              key={m}
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer select-none transition-all"
                              onClick={() => {
                                const next = isSelected
                                  ? field.value.filter((v: string) => v !== m)
                                  : [...field.value, m];
                                field.onChange(next);
                              }}
                            >
                              {m}
                            </Badge>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SectionLabel>Journal Notes</SectionLabel>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-semibold">Why I Took It</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Describe the iFVG, inversion confirmation, bias, confluence…"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emotions"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-semibold">Emotions & Psychology</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="How did you feel? Confident, hesitant, FOMO, composed…"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SectionLabel>Screenshots *</SectionLabel>

              <FormField
                control={form.control}
                name="screenshotLow"
                render={({ field }) => (
                  <FormItem>
                    <ScreenshotUploader
                      label="Low TF Screenshot"
                      value={field.value}
                      onChange={field.onChange}
                      userId={userId}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="screenshotMiddle"
                render={({ field }) => (
                  <FormItem>
                    <ScreenshotUploader
                      label="Middle TF Screenshot"
                      value={field.value}
                      onChange={field.onChange}
                      userId={userId}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="screenshotHigh"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <ScreenshotUploader
                      label="High TF Screenshot"
                      value={field.value}
                      onChange={field.onChange}
                      userId={userId}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 pt-2">
                <Button
                  type="submit"
                  disabled={!hydrated || isSubmitting}
                  className="gap-2 px-8"
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Saving…" : "Save Trade"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
