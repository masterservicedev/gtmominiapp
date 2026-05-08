# GTMO bot — Railway deploy checklist

This repo uses an **npm workspace**: the Next.js app is at the root and the grammY bot lives in `bot/`. Railway must deploy from the **repository root** so `railway.toml` and `npm run bot` resolve the workspace correctly.

---

## 1. Create `bot/.env` locally (never commit)

From the repo root:

```bash
cp bot/.env.example bot/.env
```

Edit `bot/.env` and set real values (no quotes unless a value contains spaces):

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Same mini-app bot as WebApp / Vercel `TELEGRAM_BOT_TOKEN` |
| `DATABASE_URL` | Neon pooled URL (same DB as Vercel) |
| `MINI_APP_URL` | `https://<your-project>.vercel.app` (full URL with `https://`) |
| `CHATWOOT_BASE_URL` | e.g. `https://chat.yourdomain.com` |
| `CHATWOOT_API_TOKEN` | Profile access token |
| `CHATWOOT_ACCOUNT_ID` | From Chatwoot URL `/app/accounts/<id>/` |
| `CHATWOOT_MINIAPP_INBOX_ID` | Mini App Leads inbox ID |
| `VOLUUM_POSTBACK_URL` | Base postback URL (app appends `cid` + `event`) |

`bot/.env` is listed in `.gitignore` — copy the same keys into Railway Variables manually.

---

## 2. Confirm root `railway.toml`

At repo root, [`railway.toml`](railway.toml) should contain:

```toml
[deploy]
startCommand = "npm run bot"
```

Do **not** point Railway’s root directory at `bot/` only — Nixpacks needs the root `package.json` workspaces install.

---

## 3. Confirm root `package.json` script

Root [`package.json`](package.json) must define:

```json
"bot": "npm run start -w gtmo-miniapp-bot"
```

Railway runs **`npm run bot`** from the repo root; that starts the `gtmo-miniapp-bot` workspace (`bot/package.json` → `start` → `ts-node` → `bot/index.ts`).

---

## 4. Push to GitHub

```bash
git status
git add .
git commit -m "Prepare bot for Railway deploy"
git push
```

---

## 5. Create Railway service

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select `masterservicedev/gtmominiapp` (or your repo).
2. **Root Directory**: `.` (repository root — default). **Not** `bot/`.
3. Railway reads [`railway.toml`](railway.toml) and uses `startCommand = "npm run bot"`.

---

## 6. Add Railway variables

**Project → your service → Variables**

Add every key from `bot/.env` (same names, production values). Missing or wrong `MINI_APP_URL` (must include `https://`) is a common failure mode.

---

## 7. Deploy and read logs

Trigger **Deploy**, then open **Deployments → Logs**.

Success line:

```text
GTMO bot running
```

If the process exits, check: env vars, `DATABASE_URL` reachable from Railway, bot token valid.

---

## 8. Smoke test in Telegram

1. Open the bot → send `/start`.
2. Expect an **Open App** / Web App button that opens `MINI_APP_URL`.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Build OK, bot crashes on start | Missing env var, bad `DATABASE_URL`, or wrong `TELEGRAM_BOT_TOKEN` |
| Wrong app opens | `MINI_APP_URL` typo or missing `https://` |
| `npm run bot` not found | Deploy root is not repo root, or root `package.json` missing `bot` script |
| Old code deployed | Forgot `git push` or Railway linked wrong branch |
| Works locally, fails in cloud | Neon firewall / wrong connection string; use **pooled** serverless URL |

---

## Related

- Vercel env vars for the Next app: see [`.env.example`](.env.example) and project docs under `Project Files/`.
- Bot source: [`bot/index.ts`](bot/index.ts), handlers under [`bot/handlers/`](bot/handlers/).
