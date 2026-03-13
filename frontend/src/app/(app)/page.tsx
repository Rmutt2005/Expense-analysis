"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { StatCard } from "@/components/ui/StatCard";
import { apiFetch } from "@/lib/api";
import type { Expense } from "@/lib/types";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}



export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    apiFetch<Expense[]>(
      `/expenses?start=${encodeURIComponent(iso(start))}&end=${encodeURIComponent(iso(end))}`
    )
      .then(setExpenses)
      .catch(() => setExpenses([]));
  }, []);

  const totals = useMemo(() => {
    const now = new Date();
    const today = iso(now);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const monthStart = startOfMonth(now);

    let t = 0;
    let w = 0;
    let m = 0;
    const list = expenses ?? [];
    for (const e of list) {
      const amt = Number(e.amount) || 0;
      if (e.spent_at === today) t += amt;
      if (e.spent_at >= iso(weekStart) && e.spent_at <= today) w += amt;
      if (e.spent_at >= iso(monthStart) && e.spent_at <= today) m += amt;
    }
    return { t, w, m };
  }, [expenses]);

  const recent = useMemo(() => {
    return (expenses ?? []).slice(0, 5).map((e) => ({
      id: e.id,
      date: e.spent_at,
      amount: Number(e.amount) || 0,
      note: e.note ?? "",
    }));
  }, [expenses]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="วันนี้"
            value={`฿${totals.t.toFixed(2)}`}
            sub="ยอดรวม"
            gradient="pink"
          />
          <StatCard
            label="7 วันล่าสุด"
            value={`฿${totals.w.toFixed(2)}`}
            sub="ยอดรวม"
            gradient="indigo"
          />
          <StatCard
            label="เดือนนี้"
            value={`฿${totals.m.toFixed(2)}`}
            sub="ยอดรวม"
            gradient="emerald"
          />
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">ทางลัด</div>
              <div className="mt-1 text-sm text-slate-600">
                ไปยังหน้าที่ใช้บ่อย
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="pink">บันทึก</Pill>
              <Pill tone="indigo">สรุป</Pill>
              <Pill tone="emerald">แนวโน้ม</Pill>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Link
              className="group rounded-2xl bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent p-5 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:bg-white/70"
              href="/expenses"
            >
              <div className="text-xs font-semibold tracking-wide text-slate-600">
                บันทึก
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                รายจ่ายรายวัน
              </div>
              <div className="mt-2 text-sm text-slate-600">
                เพิ่มรายการอย่างรวดเร็ว
              </div>
              <div className="mt-4 text-sm font-medium text-slate-900">
                เปิดหน้า →
              </div>
            </Link>
            <Link
              className="group rounded-2xl bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-transparent p-5 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:bg-white/70"
              href="/reports"
            >
              <div className="text-xs font-semibold tracking-wide text-slate-600">
                สรุป
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                รายงานตามช่วงเวลา
              </div>
              <div className="mt-2 text-sm text-slate-600">
                ดูยอดรวมและสัดส่วน
              </div>
              <div className="mt-4 text-sm font-medium text-slate-900">
                เปิดหน้า →
              </div>
            </Link>
            <Link
              className="group rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-5 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:bg-white/70"
              href="/ml"
            >
              <div className="text-xs font-semibold tracking-wide text-slate-600">
                แนวโน้ม
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                ค่าใช้จ่าย
              </div>
              <div className="mt-2 text-sm text-slate-600">
                ดูแนวโน้มและคาดการณ์พรุ่งนี้
              </div>
              <div className="mt-4 text-sm font-medium text-slate-900">
                เปิดหน้า →
              </div>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">ล่าสุด</div>
              <div className="mt-1 text-sm text-slate-600">
                รายการล่าสุด 5 รายการ
              </div>
            </div>
            <Link
              className="text-sm font-medium text-rose-700 hover:text-rose-800"
              href="/expenses"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {recent.length ? null : (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200/70">
                ยังไม่มีรายการ
              </div>
            )}
            {recent.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 ring-1 ring-slate-200/70"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {r.date}
                  </div>
                  <div className="text-xs text-slate-600">{r.note || " "}</div>
                </div>
                <div className="text-sm font-semibold tabular-nums text-slate-900">
                  ฿{r.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex flex-col  items-center justify-between gap-4 m-5">
            <div className="gap-6">
              <Image
              src="/images/PiggybankDashboard.png"
              alt="Saving"
              width={400}
              height={300}
              className="max-h-56 w-auto object-contain"
              priority
            />
              <div className="text-base font-semibold text-slate-900">
                เก็บออมอย่างสม่ำเสมอ
              </div>
              <div className="mt-2 text-base text-slate-600">
                บันทึกทุกวัน แล้วให้รายงานช่วยเห็นภาพรวม
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-semibold text-slate-900">
            หมวดหมู่ที่ใช้บ่อย
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="amber">ค่ากิน</Pill>
            <Pill tone="indigo">ค่าเดินทาง</Pill>
            <Pill tone="pink">ช็อปปิ้ง</Pill>
            <Pill tone="emerald">อื่นๆ</Pill>
          </div>
        </Card>
      </div>
    </div>
  );
}
