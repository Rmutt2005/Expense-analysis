import { cn } from "@/lib/cn";

import type React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  tone?: "indigo" | "emerald" | "amber" | "pink" | "slate";
};

export function Pill({ className, active, tone = "slate", ...props }: Props) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    pink: "bg-pink-50 text-pink-700 ring-pink-200",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
        tones[tone],
        active ? "ring-2 ring-slate-900/10" : "hover:brightness-95",
        className
      )}
      {...props}
    />
  );
}
