"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/traffic", label: "Traffic" },
  { href: "/admin/link-builder", label: "Link builder" },
  { href: "/admin/re-engagement", label: "Re-engage" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/insights", label: "Insights" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap justify-center gap-1 text-sm sm:justify-end">
      {links.map((n) => {
        const active =
          n.href === "/admin"
            ? pathname === "/admin"
            : n.href === "/admin/users"
              ? pathname.startsWith("/admin/users") ||
                pathname.startsWith("/admin/user/")
              : pathname === n.href || pathname.startsWith(`${n.href}/`);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              active
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
