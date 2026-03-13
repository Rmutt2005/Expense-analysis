"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import type React from "react";

import { cn } from "@/lib/cn";
import { ChartIcon, HomeIcon, ReceiptIcon, SparkIcon } from "@/components/icons";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const ITEMS: Item[] = [
  { href: "/", label: "ภาพรวม", icon: <HomeIcon /> },
  { href: "/expenses", label: "บันทึก", icon: <ReceiptIcon /> },
  { href: "/reports", label: "สรุป", icon: <ChartIcon /> },
  { href: "/ml", label: "แนวโน้ม", icon: <SparkIcon /> },
];

function NavItem({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex h-11 w-11 items-center justify-center rounded-2xl transition",
        active
          ? "bg-gradient-to-br from-pink-200/80 via-rose-100/80 to-white/70 text-rose-700 ring-1 ring-rose-200/70 shadow-[0_18px_40px_-28px_rgba(244,63,94,0.55)]"
          : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm"
      )}
      aria-label={item.label}
      title={item.label}
    >
      <span className="transition group-hover:scale-105">{item.icon}</span>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:block">
        <div className="sticky top-6">
          <div className="w-20 rounded-[28px] bg-white/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_40px_-28px_rgba(2,6,23,0.35)] ring-1 ring-slate-200/60 backdrop-blur">
            <div className="flex h-11 items-center justify-center">
              <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70">
                <Image
                  src="/images/LOGO.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  priority
                />
              </div>
            </div>
            <div className="mt-3 flex flex-col items-center gap-2">
              {ITEMS.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-3 left-1/2 z-40 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-[22px] bg-white/75 p-2 shadow-[0_20px_50px_-34px_rgba(2,6,23,0.45)] ring-1 ring-slate-200/60 backdrop-blur">
          {ITEMS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </div>
      </nav>
    </>
  );
}
