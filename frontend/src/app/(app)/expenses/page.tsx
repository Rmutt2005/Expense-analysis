"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { Category, Expense } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/Toast";
import { StatCard } from "@/components/ui/StatCard";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function ExpensesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState("");

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [spentAt, setSpentAt] = useState(todayISO());
  const [note, setNote] = useState("");

  const categoryById = useMemo(() => {
    const m = new Map<number, Category>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  const pageSize = 12;
  const [page, setPage] = useState(0);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(expenses.length / pageSize));
  }, [expenses.length]);

  const pagedExpenses = useMemo(() => {
    const start = page * pageSize;
    return expenses.slice(start, start + pageSize);
  }, [expenses, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const totals = useMemo(() => {
    const today = todayISO();
    const weekStart = isoDaysAgo(6);
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartIso = monthStart.toISOString().slice(0, 10);

    let t = 0;
    let w = 0;
    let mTotal = 0;
    for (const e of expenses) {
      const amt = Number(e.amount) || 0;
      if (e.spent_at === today) t += amt;
      if (e.spent_at >= weekStart && e.spent_at <= today) w += amt;
      if (e.spent_at >= monthStartIso && e.spent_at <= today) mTotal += amt;
    }
    return { today: t, week: w, month: mTotal };
  }, [expenses]);

  async function refresh() {
    const [cats, exps] = await Promise.all([
      apiFetch<Category[]>("/categories"),
      apiFetch<Expense[]>("/expenses"),
    ]);
    setCategories(cats);
    setExpenses(exps);
    setPage(0);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch((err) =>
      setError(err instanceof Error ? err.message : "Load failed")
    );
  }, []);

  async function onAddCategory(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newCategory.trim();
    if (!name) return;
    try {
      const created = await apiFetch<Category>("/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setNewCategory("");
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create category failed");
    }
  }

  async function onArchiveCategory(id: number) {
    setError(null);
    try {
      await apiFetch<Category>(`/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (categoryId === id) setCategoryId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive category failed");
    }
  }

  async function onAddExpense(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (categoryId === "" || !amount) return;
    try {
      const created = await apiFetch<Expense>("/expenses", {
        method: "POST",
        body: JSON.stringify({
          category_id: categoryId,
          amount,
          spent_at: spentAt,
          note: note.trim() ? note.trim() : null,
        }),
      });
      setAmount("");
      setNote("");
      setExpenses((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create expense failed");
    }
  }

  async function onDeleteExpense(id: number) {
    setError(null);
    try {
      await apiFetch<Expense>(`/expenses/${id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete expense failed");
    }
  }

  async function onSeed() {
    setError(null);
    if (!confirm("สร้างข้อมูลตัวอย่างย้อนหลัง 30 วันให้บัญชีนี้?")) return;
    try {
      await apiFetch<{
        message: string;
        days: number;
        categories_created: number;
        expenses_created: number;
      }>("/dev/seed", { method: "POST", body: JSON.stringify({ days: 30, seed: 42 }) });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="TODAY"
          value={`฿${totals.today.toFixed(2)}`}
          sub="ยอดรวมวันนี้"
          gradient="indigo"
        />
        <StatCard
          label="THIS WEEK"
          value={`฿${totals.week.toFixed(2)}`}
          sub="ยอดรวม 7 วันล่าสุด"
          gradient="emerald"
        />
        <StatCard
          label="THIS MONTH"
          value={`฿${totals.month.toFixed(2)}`}
          sub="ยอดรวมเดือนนี้"
          gradient="amber"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {error ? <InlineAlert className="flex-1" tone="error">{error}</InlineAlert> : <div />}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refresh().catch(() => {})}>
            รีเฟรช
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                หมวดหมู่
              </div>
              <div className="mt-1 text-sm text-slate-600">
                เพิ่มหมวดเพื่อใช้ตอนบันทึกรายจ่าย
              </div>
            </div>
          </div>

          <form className="mt-5 flex gap-2" onSubmit={onAddCategory}>
            <Input
              className="flex-1"
              placeholder="เช่น ค่ากิน, ค่าเดินทาง"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button className="shrink-0">เพิ่ม</Button>
          </form>

          <div className="mt-5 space-y-2">
            {categories.length ? null : (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200/70">
                ยังไม่มีหมวดหมู่
              </div>
            )}
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 ring-1 ring-slate-200/70"
              >
                <div className="text-sm font-medium text-slate-900">
                  {c.name}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onArchiveCategory(c.id)}
                >
                  ลบ
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              เพิ่มรายจ่าย
            </div>
            <div className="mt-1 text-sm text-slate-600">
              บันทึกยอดรายวัน แล้วไปดูรายงาน/ML
            </div>
          </div>

          <form className="mt-5 space-y-4" onSubmit={onAddExpense}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>วันที่</Label>
                <Input
                  className="mt-2"
                  type="date"
                  value={spentAt}
                  onChange={(e) => setSpentAt(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>หมวดหมู่</Label>
                <Select
                  className="mt-2"
                  value={categoryId}
                  onChange={(e) =>
                    setCategoryId(e.target.value ? Number(e.target.value) : "")
                  }
                  required
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>จำนวนเงิน (บาท)</Label>
                <Input
                  className="mt-2"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>หมายเหตุ</Label>
                <Input
                  className="mt-2"
                  placeholder="(ไม่ใส่ก็ได้)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <Button className="w-full">บันทึก</Button>
          </form>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              รายการล่าสุด
            </div>
            <div className="mt-1 text-sm text-slate-600">
              แสดง {pageSize} รายการต่อหน้า
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            หน้า <span className="font-semibold text-slate-900">{page + 1}</span> / {pageCount}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0}
            >
              ก่อนหน้า
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
            >
              ถัดไป
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs font-semibold tracking-wide text-slate-500">
              <tr>
                <th className="py-3">วันที่</th>
                <th>หมวด</th>
                <th className="text-right">จำนวน</th>
                <th>หมายเหตุ</th>
                <th className="text-right">การทำงาน</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length ? null : (
                <tr>
                  <td className="py-4 text-slate-600" colSpan={5}>
                    ยังไม่มีรายการ
                  </td>
                </tr>
              )}
              {pagedExpenses.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="py-3 font-medium text-slate-900">
                    {e.spent_at}
                  </td>
                  <td className="text-slate-700">
                    {categoryById.get(e.category_id)?.name ?? "-"}
                  </td>
                  <td className="text-right font-semibold tabular-nums text-slate-900">
                    ฿{Number(e.amount).toFixed(2)}
                  </td>
                  <td className="text-slate-600">{e.note ?? ""}</td>
                  <td className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteExpense(e.id)}
                    >
                      ลบ
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
