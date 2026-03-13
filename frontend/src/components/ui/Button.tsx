import { cn } from "@/lib/cn";

import type React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:opacity-60 disabled:pointer-events-none";
  const sizes =
    size === "sm" ? "h-9 px-3 text-sm" : "h-11 px-4 text-sm";
  const variants: Record<string, string> = {
    primary:
      "bg-slate-900 text-white shadow-sm hover:bg-slate-800",
    secondary:
      "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      className={cn(base, sizes, variants[variant], className)}
      {...props}
    />
  );
}
