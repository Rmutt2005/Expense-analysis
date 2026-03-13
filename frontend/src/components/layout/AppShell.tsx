import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";

import type React from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-28 md:grid-cols-[80px_1fr] md:pb-10">
        <div className="pt-6">
          <AppSidebar />
        </div>
        <div>
          <AppTopbar />
          <main className="mt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
