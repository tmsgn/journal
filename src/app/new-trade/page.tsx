"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Loader2 } from "lucide-react";
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
  entryTimeframeOptions,
  getTodayDateString,
  outcomeOptions,
  po3TimeOptions,
  ratingOptions,
  type TradeFormValues,
  tradeSchema,
  useJournal,
} from "@/hooks/use-journal";
import { useState } from "react";

type TradeFormInput = z.input<typeof tradeSchema>;

const defaultValues: TradeFormInput = {
  tradeDate: getTodayDateString(),
  entryTimeframe: "1min",
  po3Time: undefined,
  rating: "A",
  rr: 1,
  outcome: "win",
  reason: "",
  emotions: "",
  screenshotLow: "",
  screenshotMiddle: "",
  screenshotHigh: "",
};

export default function NewTradePage() {
  const { addTrade, hydrated, userId } = useJournal();
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

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight">Log Trade</h1>
        <p className="text-muted-foreground text-sm">
          Record your iFVG inversion setup and journal context.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            New Journal Entry
          </CardTitle>
          <CardDescription className="text-xs">
            Date auto-fills to today. Stored in Supabase — safe across devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-5 md:grid-cols-2"
            >
              {/* Trade Setup */}
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Trade Setup
                </p>
              </div>

              <FormField
                control={form.control}
                name="tradeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="entryTimeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Entry Timeframe</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {entryTimeframeOptions.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="po3Time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      PO3 Time{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
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
                        {po3TimeOptions.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Setup Rating</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ratingOptions.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Risk-Reward (RR)</FormLabel>
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
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Outcome</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {outcomeOptions.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Journal Notes */}
              <div className="md:col-span-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Journal Notes
                </p>
              </div>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs">Why I Took It</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Describe the iFVG, inversion confirmation, bias…"
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
                    <FormLabel className="text-xs">
                      Emotions & Psychology
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="How did you feel? Confident, hesitant, FOMO…"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Screenshots */}
              <div className="md:col-span-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Screenshots
                </p>
              </div>
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
                  className="gap-2 px-6"
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
