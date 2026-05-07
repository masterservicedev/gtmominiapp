# GTMO Mini App — API Routes

## Route: POST /api/init

Fires on mini app open — BEFORE questionnaire starts.
Creates user record immediately so lifetime tracking works even on abandonment.

```typescript
// app/api/init/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/validation';
import { db } from '@/lib/db';
import { users, events, offers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, voluumCid, entryVariant } = body;

    // Validate Telegram identity
    const { user: tgUser } = validateInitData(initData);

    // Resolve country from IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0';

    let country = null;
    let countryCode = null;
    try {
      const geo = await axios.get(`https://ipapi.co/${ip}/json/`);
      country = geo.data.country_name;
      countryCode = geo.data.country_code;
    } catch {
      // Geo lookup failure is non-fatal
    }

    // Assign entry variant if not provided
    let variant = entryVariant;
    if (!variant) {
      const activeOffers = await db
        .select()
        .from(offers)
        .where(eq(offers.active, true));

      if (activeOffers.length > 0) {
        variant = activeOffers[Math.floor(Math.random() * activeOffers.length)].name;
      }
    }

    // Upsert user — create if new, update lastSeen if returning
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, tgUser.id))
      .limit(1);

    let userId: string;

    if (existing.length === 0) {
      // New user
      const [newUser] = await db.insert(users).values({
        telegramId: tgUser.id,
        username: tgUser.username || null,
        firstName: tgUser.first_name || null,
        languageCode: tgUser.language_code || null,
        voluumCid: voluumCid || null,
        entryVariant: variant || null,
        country,
        countryCode,
        source: 'mini_app',
        miniAppUser: true,
        bundleEligible: true,
      }).returning();

      userId = newUser.id;
    } else {
      // Returning user — update lastSeen
      userId = existing[0].id;
      await db
        .update(users)
        .set({ lastSeenAt: new Date() })
        .where(eq(users.telegramId, tgUser.id));
    }

    // Log app_open event
    await db.insert(events).values({
      userId,
      telegramId: tgUser.id,
      eventType: 'app_open',
      metadata: { variant, cid: voluumCid, returning: existing.length > 0 },
      country,
    });

    return NextResponse.json({
      success: true,
      userId,
      variant: variant || 'default',
      isReturning: existing.length > 0,
      existingSegment: existing[0]?.segment || null,
    });

  } catch (error: any) {
    console.error('/api/init error:', error.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

---

## Route: POST /api/score

Fires when user submits completed questionnaire.

```typescript
// app/api/score/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/validation';
import { db } from '@/lib/db';
import { users, questionnaireAnswers, events, nurtureQueue } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculateScore } from '@/lib/scoring';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, answers } = body;
    // answers = { capital, experience, goal, readiness }

    const { user: tgUser } = validateInitData(initData);

    // Soft exit check — age gate
    if (!answers.ageVerified) {
      return NextResponse.json({
        exit: true,
        reason: 'age',
        message: 'You must be 18 or over to continue.',
      });
    }

    // Calculate score
    const result = calculateScore({
      capital: answers.capital,
      experience: answers.experience,
      goal: answers.goal,
      readiness: answers.readiness,
    });

    // Soft exit — no capital + not ready
    if (answers.capital === 'under_100' && answers.readiness === 'not_ready') {
      return NextResponse.json({
        exit: true,
        reason: 'not_ready',
        segment: 'LOW',
        message: "No problem — join the free channel to follow along and come back when you're ready.",
        channelLink: process.env.NEXT_PUBLIC_CHANNEL_LINK,
      });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, tgUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Save questionnaire answers
    await db.insert(questionnaireAnswers).values({
      userId: user.id,
      ageVerified: answers.ageVerified,
      capital: answers.capital,
      experience: answers.experience,
      goal: answers.goal,
      readiness: answers.readiness,
      rawScore: result.rawScore,
      cappedScore: result.cappedScore,
    });

    // Update user with score and segment
    await db.update(users)
      .set({
        score: result.cappedScore,
        segment: result.segment,
        questionnaireCompleted: true,
        questionnaireCompletedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Log event
    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: 'questionnaire_complete',
      metadata: {
        score: result.cappedScore,
        segment: result.segment,
        capital: answers.capital,
        readiness: answers.readiness,
      },
      country: user.country,
    });

    // Schedule nurture sequence for MID users
    if (result.segment === 'MID') {
      const now = new Date();
      const schedules = [
        new Date(now.getTime()),                         // Day 0 — immediate
        new Date(now.getTime() + 24 * 60 * 60 * 1000), // Day 1
        new Date(now.getTime() + 48 * 60 * 60 * 1000), // Day 2
      ];

      for (let i = 0; i < schedules.length; i++) {
        await db.insert(nurtureQueue).values({
          userId: user.id,
          telegramId: user.telegramId,
          step: i,
          scheduledAt: schedules[i],
          status: 'pending',
        });
      }
    }

    // Fire Voluum postback for questionnaire_complete
    if (user.voluumCid) {
      fetch(
        `${process.env.VOLUUM_POSTBACK_URL}?cid=${user.voluumCid}&event=questionnaire_complete`,
        { method: 'GET' }
      ).catch(() => {}); // non-blocking
    }

    return NextResponse.json({
      success: true,
      score: result.cappedScore,
      segment: result.segment,
      channelLink: process.env.NEXT_PUBLIC_CHANNEL_LINK,
      // HIGH users are told to send READY — CRM card fires on that reply
      requiresConfirmation: result.segment === 'HIGH',
    });

  } catch (error: any) {
    console.error('/api/score error:', error.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

---

## Route: POST /api/event

Generic event tracking — fires for offer_view, offer_complete etc.

```typescript
// app/api/event/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/validation';
import { db } from '@/lib/db';
import { users, events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, eventType, metadata } = body;

    const { user: tgUser } = validateInitData(initData);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, tgUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType,
      metadata: metadata || {},
      country: user.country,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

---

## Route: POST /api/chatwoot/webhook

Receives webhooks from Chatwoot when a new conversation opens or a message is received on the support bot inbox. Used to look up returning mini app users.

```typescript
// app/api/chatwoot/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { addChatwootNote } from '@/lib/chatwoot';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Only process new conversations and incoming messages
    if (!['conversation_created', 'message_created'].includes(payload.event)) {
      return NextResponse.json({ ok: true });
    }

    // Extract telegram_id from Chatwoot contact metadata
    // Chatwoot stores the Telegram ID in the contact's identifier field
    const telegramId = payload.meta?.sender?.identifier
      ? parseInt(payload.meta.sender.identifier)
      : null;

    if (!telegramId) {
      return NextResponse.json({ ok: true });
    }

    // Look up mini app history
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user || !user.miniAppUser) {
      return NextResponse.json({ ok: true });
    }

    // Returning mini app user — add context note to conversation
    const conversationId = payload.id || payload.conversation?.id;
    if (!conversationId) return NextResponse.json({ ok: true });

    const daysSince = Math.floor(
      (Date.now() - new Date(user.createdAt!).getTime()) / (1000 * 60 * 60 * 24)
    );

    const note = [
      `⚡ RETURNING MINI APP USER`,
      ``,
      `Originally qualified: ${daysSince} days ago`,
      `Score at entry: ${user.score} (${user.segment})`,
      `Capital declared: ${user.questionnaireAnswers || 'see DB'}`,
      `Entry variant: ${user.entryVariant || 'unknown'}`,
      `Source CID: ${user.voluumCid || 'none'}`,
      `Products owned: ${user.productsUnlocked?.join(', ') || 'none'}`,
      `Bundle eligible: ${user.bundleEligible && !user.bundleUsed ? 'YES — first deposit' : 'NO'}`,
    ].join('\n');

    await addChatwootNote(conversationId, note);

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('Chatwoot webhook error:', error.message);
    return NextResponse.json({ ok: true }); // always 200 to Chatwoot
  }
}
```

---

## Route: GET /api/analytics

Internal dashboard data endpoint. Protected by ANALYTICS_SECRET header.

```typescript
// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-analytics-secret');
  if (secret !== process.env.ANALYTICS_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // All queries run in parallel
  const [usersByCountry, offerPerformance, conversionByCountry, segmentBreakdown] =
    await Promise.all([
      // Users by country
      db.execute(sql`
        SELECT country, COUNT(*) as users
        FROM users
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY users DESC
        LIMIT 20
      `),

      // Offer performance
      db.execute(sql`
        SELECT
          entry_variant as offer,
          COUNT(DISTINCT u.id) as users,
          COUNT(*) FILTER (WHERE e.event_type = 'offer_view') as views,
          COUNT(*) FILTER (WHERE e.event_type = 'offer_complete') as completes,
          COUNT(*) FILTER (WHERE e.event_type = 'questionnaire_complete') as questionnaire_done,
          COUNT(*) FILTER (WHERE e.event_type = 'crm_triggered') as crm_leads
        FROM users u
        LEFT JOIN events e ON e.user_id = u.id
        GROUP BY entry_variant
      `),

      // Conversion by country
      db.execute(sql`
        SELECT
          u.country,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT u.id) FILTER (WHERE u.questionnaire_completed = true) as completed_q,
          COUNT(DISTINCT u.id) FILTER (WHERE u.crm_triggered = true) as crm_leads,
          COUNT(DISTINCT u.id) FILTER (WHERE u.segment = 'HIGH') as high_intent,
          COUNT(DISTINCT u.id) FILTER (WHERE u.segment = 'MID') as mid_intent
        FROM users u
        WHERE u.country IS NOT NULL
        GROUP BY u.country
        ORDER BY total_users DESC
        LIMIT 20
      `),

      // Segment breakdown
      db.execute(sql`
        SELECT
          segment,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
        FROM users
        GROUP BY segment
      `),
    ]);

  return NextResponse.json({
    usersByCountry: usersByCountry.rows,
    offerPerformance: offerPerformance.rows,
    conversionByCountry: conversionByCountry.rows,
    segmentBreakdown: segmentBreakdown.rows,
    generatedAt: new Date().toISOString(),
  });
}
```
