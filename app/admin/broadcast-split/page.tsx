import { redirect } from "next/navigation";

/** A/B split testing removed — queue + send stats live on Re-engage. */
export default function BroadcastSplitRedirectPage() {
  redirect("/admin/re-engagement");
}
