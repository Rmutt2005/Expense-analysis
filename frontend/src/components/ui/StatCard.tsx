import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string;
  sub?: string;
  gradient?: "indigo" | "pink" | "emerald" | "amber";
};

export function StatCard({ label, value, sub, gradient = "indigo" }: Props) {
  const gradients: Record<string, string> = {
    indigo:
      "from-indigo-400/10 via-indigo-400/4 to-transparent",
    pink: "from-rose-400/10 via-pink-400/4 to-transparent",
    emerald:
      "from-emerald-400/10 via-emerald-400/4 to-transparent",
    amber:
      "from-amber-300/12 via-amber-200/4 to-transparent",
  };

  return (
    <Card className="relative overflow-hidden p-5">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          gradients[gradient]
        )}
      />
      <div className="relative">
        <div className="text-sm font-semibold tracking-wide text-slate-500">
          {label}
        </div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {value}
        </div>
        {sub ? (
          <div className="mt-1 text-base text-slate-600">{sub}</div>
        ) : null}
      </div>
    </Card>
  );
}
