"use client";

import { cn } from "@/lib/cn";

import type React from "react";

export function InlineAlert({
  tone = "error",
  className,
  children,
}: {
  tone?: "error" | "info" | "success";
  className?: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    error: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-slate-200 bg-slate-50 text-slate-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm shadow-sm",
        tones[tone],
        className
      )}
    >
      {children}
    </div>
  );
}
