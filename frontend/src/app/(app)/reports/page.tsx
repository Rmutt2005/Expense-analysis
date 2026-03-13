"use client";

import { FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { Summary } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/Toast";
import { StatCard } from "@/components/ui/StatCard";

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function CategoryBar({
  name,
  percent,
  total,
  avgPerDay,
}: {
  name: string;
  percent: number;
  total: number;
  avgPerDay: number;
}) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div className="rounded-2xl bg-white/60 p-4 ring-1 ring-slate-200/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{name}</div>
          <div className="mt-1 text-xs text-slate-600">
            เฉลี่ย/วัน ฿{avgPerDay.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums text-slate-900">
            ฿{total.toFixed(2)}
          </div>
          <div className="mt-1 text-xs font-medium tabular-nums text-slate-600">
            {width.toFixed(1)}%
          </div>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100 ring-1 ring-slate-200/60">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [start, setStart] = useState(isoDaysAgo(6));
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<Summary>(
        `/analytics/summary?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_180px]" onSubmit={onSubmit}>
          <div>
            <Label>เริ่ม</Label>
            <Input
              className="mt-2"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>ถึง</Label>
            <Input
              className="mt-2"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button disabled={loading} className="w-full">
              {loading ? "กำลังคำนวณ..." : "ดูสรุป"}
            </Button>
          </div>
        </form>
      </Card>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="TOTAL"
              value={`฿${data.grand_total.toFixed(2)}`}
              sub={`${data.start} ถึง ${data.end}`}
              gradient="indigo"
            />
            <StatCard
              label="AVG / DAY"
              value={`฿${(data.grand_total / data.days).toFixed(2)}`}
              sub={`เฉลี่ย ${data.days} วัน`}
              gradient="emerald"
            />
            <StatCard
              label="DAYS"
              value={`${data.days}`}
              sub="จำนวนวันในช่วง"
              gradient="amber"
            />
          </div>

          <Card className="p-6">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  แยกตามหมวดหมู่
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  เปอร์เซ็นต์คิดจากยอดรวมทั้งหมดในช่วง
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {data.by_category.map((c) => (
                <CategoryBar
                  key={c.category_id}
                  name={c.category_name}
                  percent={c.percent_of_total}
                  total={c.total_amount}
                  avgPerDay={c.avg_per_day}
                />
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
