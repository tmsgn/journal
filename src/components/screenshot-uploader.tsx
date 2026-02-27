"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ImageIcon, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScreenshotUploaderProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  userId: string | null;
}

export function ScreenshotUploader({
  label,
  value,
  onChange,
  userId,
}: ScreenshotUploaderProps) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!userId) return;
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("trade-screenshots")
      .upload(path, file, { contentType: file.type });

    if (!error) {
      const { data } = supabase.storage
        .from("trade-screenshots")
        .getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !value && inputRef.current?.click()}
        onKeyDown={(e) =>
          e.key === "Enter" && !value && inputRef.current?.click()
        }
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className={cn(
          "relative flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 overflow-hidden",
          value
            ? "border-primary/30 bg-primary/5 h-32 cursor-default"
            : "h-20 cursor-pointer",
          dragOver
            ? "border-primary bg-primary/10"
            : !value &&
                "border-border/60 hover:border-primary/50 hover:bg-primary/5",
        )}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-red-400 ring-1 ring-border/60"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
            <span className="text-[11px]">Drop image or click to upload</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {/* Fallback text input for URLs */}
      {!value && (
        <input
          type="text"
          placeholder="Or enter URL manually"
          className="w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-xs text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
