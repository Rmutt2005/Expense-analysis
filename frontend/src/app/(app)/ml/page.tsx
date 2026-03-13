"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { Expense, Forecast } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { InlineAlert } from "@/components/ui/Toast";
import { StatCard } from "@/components/ui/StatCard";
import { SpendingLineChart, type Point } from "@/components/charts/SpendingLineChart";

function trendLabel(value: number) {
  if (!Number.isFinite(value) || Math.abs(value) < 1e-9) {
    return { direction: "คงที่", abs: 0 };
  }
  if (value > 0) return { direction: "มากขึ้น", abs: value };
  return { direction: "น้อยลง", abs: Math.abs(value) };
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function MlPage() {
  const [data, setData] = useState<Forecast | null>(null);
  const [series, setSeries] = useState<Point[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);

    Promise.all([
      apiFetch<Forecast>("/ml/forecast?lookback_days=30"),
      apiFetch<Expense[]>(
        `/expenses?start=${encodeURIComponent(iso(start))}&end=${encodeURIComponent(iso(end))}`
      ),
    ])
      .then(([forecast, expenses]) => {
        setData(forecast);

        const totals = new Map<string, number>();
        for (const e of expenses) {
          totals.set(e.spent_at, (totals.get(e.spent_at) ?? 0) + (Number(e.amount) || 0));
        }

        const points: Point[] = [];
        for (let i = 0; i < 30; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const key = iso(d);
          points.push({ date: key, value: totals.get(key) ?? 0 });
        }
        setSeries(points);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, []);

  const nonZeroDays = series ? series.filter((p) => p.value > 0).length : 0;
  const baselineMode = data?.model.includes("baseline") ?? false;

  return (
    <div className="space-y-6">
      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      {!data ? (
        <div className="text-sm text-slate-600">กำลังโหลด...</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="พรุ่งนี้ (คาดการณ์)"
              value={`฿${data.predicted_total.toFixed(2)}`}
              sub={`ประมาณการวันที่ ${data.forecast_date}`}
              gradient="indigo"
            />
            {(() => {
              const t = trendLabel(data.trend_baht_per_day);
              return (
                <StatCard
                  label="เพิ่ม/ลดเฉลี่ยต่อวัน"
                  value={`฿${t.abs.toFixed(2)}`}
                  sub={`มีแนวโน้ม${t.direction} (บาท/วัน)`}
                  gradient="pink"
                />
              );
            })()}
            {(() => {
              const t = trendLabel(data.trend_percent_per_day);
              return (
                <StatCard
                  label="เพิ่ม/ลดเฉลี่ยต่อวัน"
                  value={`${t.abs.toFixed(2)}%`}
                  sub={`มีแนวโน้ม${t.direction} (%/วัน)`}
                  gradient="emerald"
                />
              );
            })()}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-6">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    ค่าใช้จ่าย 30 วันล่าสุด
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    แสดงยอดรวมต่อวัน เพื่อเห็นรูปแบบการใช้จ่าย
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  มีข้อมูลใช้จ่ายจริง{" "}
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {nonZeroDays}
                  </span>
                  /30 วัน
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-white/60 p-4 ring-1 ring-slate-200/70">
                {series ? <SpendingLineChart data={series} /> : null}
              </div>

              {series ? (
                <div className="mt-4 rounded-2xl bg-white/60 p-4 ring-1 ring-slate-200/70">
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm font-semibold text-slate-900">
                      10 วันล่าสุด
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      ยอดรวมต่อวัน
                    </div>
                  </div>
                  <div className="mt-3 flex items-end gap-1.5">
                    {(() => {
                      const last10 = series.slice(-10);
                      const max = Math.max(1, ...last10.map((p) => p.value));
                      return last10.map((p) => {
                        const h = Math.max(2, Math.round((p.value / max) * 44));
                        return (
                          <div key={p.date} className="flex-1">
                            <div
                              className="rounded-full bg-gradient-to-t from-rose-400/60 to-indigo-400/30"
                              style={{ height: `${h}px` }}
                              title={`${p.date}: ฿${p.value.toFixed(2)}`}
                            />
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : null}

              {nonZeroDays < 30 ? (
                <div className="mt-4 text-sm text-slate-600">
                  แนะนำบันทึกรายจ่ายต่อเนื่องให้ครบ 30 วัน เพื่อให้การคาดการณ์เสถียรขึ้น
                </div>
              ) : null}
            </Card>

            <Card className="p-6">
              <div className="text-sm font-semibold text-slate-900">ความแม่นยำ</div>
              <div className="mt-1 text-sm text-slate-600">
                ประเมินจากการลองทำนายย้อนกลับในข้อมูลที่ผ่านมา
              </div>
              <div className="mt-4 rounded-2xl bg-white/60 p-4 ring-1 ring-slate-200/70">
                {data.backtest_mae === null ? (
                  <div className="text-sm text-slate-600">
                    ยังมีข้อมูลไม่พอสำหรับการประเมินความแม่นยำ
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-semibold tracking-wide text-slate-500">ความคลาดเคลื่อนเฉลี่ย</div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                      ฿{data.backtest_mae.toFixed(2)}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">จาก {data.backtest_samples} วันทดสอบ</div>
                  </>
                )}
              </div>

              {baselineMode ? (
                <div className="mt-4 text-sm text-slate-600">
                  ตอนนี้ระบบใช้ “ค่าเฉลี่ย 7 วันล่าสุด” เป็นหลัก เพราะข้อมูลยังไม่พอให้เรียนรู้รูปแบบรายสัปดาห์ได้เต็มที่
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-600">
                  ระบบอิงพฤติกรรมวันในสัปดาห์และยอดก่อนหน้า เพื่อช่วยคาดการณ์วันถัดไป
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-rose-700 hover:text-rose-800">
                  ดูรายละเอียดการคำนวณ
                </summary>
                <div className="mt-3 text-sm text-slate-600">
                  โมเดลที่ใช้: <span className="font-medium text-slate-900">{data.model}</span>
                  <div className="mt-1">
                    ใช้ข้อมูลย้อนหลัง {data.data_days_used} วัน และชุดข้อมูลสำหรับฝึก {data.train_samples} ตัวอย่าง
                  </div>
                </div>
              </details>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
