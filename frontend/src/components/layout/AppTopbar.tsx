"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { LogoutIcon } from "@/components/icons";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "ภาพรวม", subtitle: "สรุปค่าใช้จ่ายล่าสุดในมุมมองเดียว" },
  "/expenses": { title: "บันทึกรายจ่าย", subtitle: "เพิ่มหมวดหมู่และรายการรายวัน" },
  "/reports": { title: "สรุปรายจ่าย", subtitle: "เลือกช่วงวัน ดูยอดรวมและเปอร์เซ็นต์" },
  "/ml": { title: "แนวโน้มค่าใช้จ่าย", subtitle: "คาดการณ์พรุ่งนี้และดูแนวโน้ม 30 วันล่าสุด" },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h > 6) return "สวัสดีตอนเช้า";
  if (h > 12) return "สวัสดีตอนบ่าย";
  if (h > 18) return "สวัสดีตอนดึก";
  return "สวัสดีตอนดึก";
}

export function AppTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<User | null>(null);

  const heading = useMemo(() => TITLES[pathname] ?? TITLES["/"], [pathname]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<User>("/users/me")
      .then((u) => {
        if (!cancelled) setMe(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function onLogout() {
    try {
      await apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="pt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-base font-medium text-slate-500">
            {getGreeting()}
            {me ? `, ${me.email.split("@")[0]}` : ""}
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
            {heading.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            {heading.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="secondary" onClick={onLogout} className="gap-2">
            <LogoutIcon />
            ออกจากระบบ
          </Button>
        </div>
      </div>
    </header>
  );
}
