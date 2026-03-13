"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/Toast";

export function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch<User>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="relative overflow-hidden p-7">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-indigo-400/15 blur-2xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-pink-400/15 blur-2xl" />

        <div className="relative">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            เข้าสู่ระบบ
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            ใช้ email/password ที่สมัครไว้
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label>อีเมล</Label>
              <Input
                className="mt-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label>รหัสผ่าน</Label>
              <Input
                className="mt-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
            </div>

            {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

            <Button disabled={loading} className="w-full">
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            ยังไม่มีบัญชี?{" "}
            <Link className="font-medium text-slate-900 underline" href="/register">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
