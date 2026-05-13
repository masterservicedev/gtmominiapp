"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { AdminNav } from "./AdminNav";

const brand = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin"
            className={`${brand.className} group shrink-0 select-none`}
          >
            <span className="text-[1.125rem] font-semibold tracking-[-0.04em] text-zinc-50 sm:text-[1.1875rem]">
              GTMO
              <span className="font-medium text-zinc-500 transition-colors group-hover:text-emerald-400/85">
                {" "}
                Admin
              </span>
            </span>
          </Link>
          <div className="flex w-full min-w-0 justify-center sm:w-auto sm:justify-end">
            <AdminNav />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
