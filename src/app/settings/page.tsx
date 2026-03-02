"use client";

import { useState } from "react";
import { useSettings, type JournalSettings } from "@/hooks/use-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Settings, Plus, X } from "lucide-react";

function ConfigSection({
  title,
  description,
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  title: string;
  description: string;
  items: string[];
  onAdd: (val: string) => void;
  onRemove: (val: string) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const val = input.trim();
    if (val) {
      onAdd(val);
      setInput("");
    }
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="px-2 py-1 pr-1 gap-1 flex items-center"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="hover:bg-destructive hover:text-destructive-foreground rounded-full flex items-center justify-center p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {items.length === 0 && (
            <span className="text-xs text-muted-foreground italic">
              No items (default fallback may apply)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 max-w-sm">
          <Input
            className="h-8 text-xs"
            placeholder={placeholder || "Add new option..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button
            size="sm"
            className="h-8 px-3 gap-1"
            onClick={handleAdd}
            disabled={!input.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const {
    settings,
    isPublic,
    shareToken,
    addOption,
    removeOption,
    togglePublic,
    hydrated,
  } = useSettings();

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-40 rounded-xl bg-muted animate-pulse" />
          <div className="h-40 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Journal Customization
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure the dropdown options exactly to your trading strategy. Saves
          automatically to this browser.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Share Your Journal
            </CardTitle>
            <CardDescription className="text-xs">
              Make your logged trades publicly visible so others can review your
              journal. Your private data and editable fields remains secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Public Access</p>
                <p className="text-xs text-muted-foreground">
                  Anyone with the link can view your trades
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={togglePublic} />
            </div>
            {isPublic && shareToken && (
              <div className="flex items-center gap-2 mt-4">
                <Input
                  readOnly
                  className="font-mono text-xs text-muted-foreground"
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/shared/${shareToken}`}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/shared/${shareToken}`,
                    );
                    toast.success("Link copied to clipboard!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <ConfigSection
          title="Entry Timeframes"
          description="E.g. 15sec, 1min, 5min, 1H. Used for categorization."
          items={settings.timeframes}
          onAdd={(val) => addOption("timeframes", val)}
          onRemove={(val) => removeOption("timeframes", val)}
          placeholder="e.g. 15sec"
        />

        <ConfigSection
          title="Setup Ratings"
          description="Grade your setups. You can stick to letters (A, B) or switch to High/Med/Low."
          items={settings.ratings}
          onAdd={(val) => addOption("ratings", val)}
          onRemove={(val) => removeOption("ratings", val)}
          placeholder="e.g. A+"
        />

        <ConfigSection
          title="Draw on Liquidity (DOL)"
          description="E.g. ERL, PD-X, PW-X, imbalance, session liquidity."
          items={settings.dols}
          onAdd={(val) => addOption("dols", val)}
          onRemove={(val) => removeOption("dols", val)}
          placeholder="e.g. ERL"
        />

        <ConfigSection
          title="Models / Tags"
          description="E.g. BNQ, MECH, PDI, CONT. You can select multiple per trade."
          items={settings.models}
          onAdd={(val) => addOption("models", val)}
          onRemove={(val) => removeOption("models", val)}
          placeholder="e.g. BNQ"
        />

        <ConfigSection
          title="PO3 Times (Killzones)"
          description="Key structural or session times. E.g. 9:30, London Open."
          items={settings.po3Times}
          onAdd={(val) => addOption("po3Times", val)}
          onRemove={(val) => removeOption("po3Times", val)}
          placeholder="e.g. 13:30 (PM Session)"
        />
      </div>
    </div>
  );
}
