/**
 * Admin API calls: sends HttpOnly `admin_auth` cookie + optional
 * `sessionStorage.getItem("x-admin-secret")` as `x-admin-secret` header (dev / scripts).
 */
export async function adminApi(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (typeof window !== "undefined") {
    const fromStore = sessionStorage.getItem("x-admin-secret");
    if (fromStore) headers.set("x-admin-secret", fromStore);
  }
  return fetch(path, { ...init, credentials: "include", headers });
}
