export function voluumPostbackUrl(
  baseUrl: string | undefined,
  cid: string,
  event: string,
): string {
  if (!baseUrl) return "";
  try {
    const u = new URL(baseUrl);
    u.searchParams.set("cid", cid);
    u.searchParams.set("event", event);
    return u.toString();
  } catch {
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}cid=${encodeURIComponent(cid)}&event=${encodeURIComponent(event)}`;
  }
}
