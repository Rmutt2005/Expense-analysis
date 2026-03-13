import Image from "next/image";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 lg:grid-cols-2">
        <div className="hidden lg:block">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-slate-200/70 backdrop-blur">
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
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Daily Spend
              </div>
              <div className="text-sm text-slate-600">Expense dashboard</div>
            </div>
          </div>

          <div className="mt-10 max-w-md">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Track spending.
              <span className="text-slate-500"> See trends.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              บันทึกรายจ่ายรายวัน ดูสรุปตามช่วงเวลา และติดตามแนวโน้มค่าใช้จ่ายของคุณ
            </p>
          </div>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
