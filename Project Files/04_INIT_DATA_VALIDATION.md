# GTMO Mini App — initData Validation

## Why This Is Mandatory

Every request from the mini app frontend to your API includes Telegram's `initData` string. Without validating this server-side, anyone can:
- Fake a telegram_id and impersonate a user
- Submit fabricated questionnaire answers
- Inject fake high-score leads into Chatwoot
- Abuse the referral system

This is not optional. Build this before any other API route.

---

## How Telegram initData Works

When the mini app loads, Telegram injects a signed string into `window.Telegram.WebApp.initData`. It looks like:

```
query_id=AAHdF...&user=%7B%22id%22%3A123456%2C%22first_name%22...&auth_date=1234567890&hash=abc123...
```

The `hash` field is an HMAC-SHA256 signature. You verify it server-side using your bot token. If the hash matches, the data is genuine and came from a real Telegram user.

---

## File: lib/validation.ts

```typescript
import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ValidatedInitData {
  user: TelegramUser;
  query_id?: string;
  auth_date: number;
  hash: string;
}

/**
 * Validates Telegram WebApp initData using HMAC-SHA256
 * Returns parsed user data if valid, throws if invalid
 */
export function validateInitData(initData: string): ValidatedInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    throw new Error('Missing hash in initData');
  }

  // Remove hash from params before checking
  params.delete('hash');

  // Sort params alphabetically and join with newline
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Create secret key: HMAC-SHA256 of bot token using "WebAppData" as key
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest();

  // Calculate expected hash
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (expectedHash !== hash) {
    throw new Error('Invalid initData hash — request rejected');
  }

  // Check auth_date is not older than 24 hours
  const authDate = parseInt(params.get('auth_date') || '0');
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    throw new Error('initData expired');
  }

  // Parse user object
  const userRaw = params.get('user');
  if (!userRaw) {
    throw new Error('Missing user in initData');
  }

  const user: TelegramUser = JSON.parse(decodeURIComponent(userRaw));

  return {
    user,
    query_id: params.get('query_id') || undefined,
    auth_date: authDate,
    hash,
  };
}
```

---

## How to Use in API Routes

Every API route that receives data from the mini app must call this:

```typescript
// app/api/init/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, voluumCid, entryVariant } = body;

    // Validate first — reject if invalid
    const { user } = validateInitData(initData);

    // Now safe to use user.id as telegram_id
    const telegramId = user.id;

    // ... rest of your logic

  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

---

## Frontend: How to Send initData

```typescript
// In your Next.js pages/components
import WebApp from '@twa-dev/sdk';

// On component mount
useEffect(() => {
  WebApp.ready();
}, []);

// When making API calls
const response = await fetch('/api/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    initData: WebApp.initData,  // This is the signed string
    voluumCid: startParam.cid,
    entryVariant: startParam.variant,
  }),
});
```

---

## Reading the startapp Parameter

The deep link from your ads is:
```
https://t.me/YourMiniAppBot/app?startapp=cid_ABC123_lp2
```

Parse this on the frontend:

```typescript
import WebApp from '@twa-dev/sdk';

function parseStartParam(startParam: string) {
  // Format: cid_VOLUUMID_VARIANT
  const parts = startParam.split('_');
  // cid_ABC123_lp2 → ['cid', 'ABC123', 'lp2']
  return {
    cid: parts[1] || null,
    variant: parts[2] || null,
  };
}

const startParam = WebApp.initDataUnsafe?.start_param || '';
const { cid, variant } = parseStartParam(startParam);
```

---

## Testing initData in Development

Telegram only generates real initData when the app is opened inside Telegram. For local development:

1. Use ngrok to expose localhost: `ngrok http 3000`
2. Set your mini app URL in BotFather to the ngrok URL
3. Open the bot in Telegram on your phone
4. Use real initData from your actual Telegram account

Do not mock initData in production code. Do not add a bypass for development that could accidentally ship to production.
