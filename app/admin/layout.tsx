import { DM_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookieToken } from "@/lib/admin-session";
import { AdminShell } from "./_components/AdminShell";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) redirect("/");

  const token = adminCookieToken(secret);
  const cookie = cookies().get("admin_auth")?.value;
  if (cookie !== token) redirect("/");

  return (
    <div className={`${dmSans.className} min-h-screen`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
