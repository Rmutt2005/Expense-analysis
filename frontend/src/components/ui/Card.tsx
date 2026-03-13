import { cn } from "@/lib/cn";

import type React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "surface" | "soft";
};

export function Card({ className, variant = "surface", ...props }: Props) {
  const variants: Record<string, string> = {
    surface:
      "bg-white/80 backdrop-blur ring-1 ring-slate-200/70 shadow-[0_12px_32px_-22px_rgba(2,6,23,0.22)]",
    soft:
      "bg-white/60 backdrop-blur ring-1 ring-slate-200/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_32px_-24px_rgba(2,6,23,0.18)]",
  };
  return (
    <div
      className={cn(
        "rounded-2xl transition duration-200 will-change-transform hover:-translate-y-[1px] hover:shadow-[0_20px_60px_-42px_rgba(2,6,23,0.45)]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
