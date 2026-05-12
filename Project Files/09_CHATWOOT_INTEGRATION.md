# GTMO Mini App — Chatwoot Integration

## File: lib/chatwoot.ts

```typescript
import axios from 'axios';

const chatwoot = axios.create({
  baseURL: `${process.env.CHATWOOT_BASE_URL}/api/v1`,
  headers: {
    'api_access_token': process.env.CHATWOOT_API_TOKEN,
    'Content-Type': 'application/json',
  },
});

const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

/**
 * Add a private note to a conversation (visible to agents only, not the user)
 */
export async function addChatwootNote(conversationId: string, content: string) {
  try {
    await chatwoot.post(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        content,
        message_type: 'outgoing',
        private: true, // Private note — agent sees, user does not
      }
    );
  } catch (err: any) {
    console.error('Chatwoot note error:', err.message);
  }
}

/**
 * Add a label to a conversation
 */
export async function addLabel(conversationId: string, label: string) {
  try {
    // Get current labels first
    const { data } = await chatwoot.get(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}`
    );
    const currentLabels: string[] = data.labels || [];

    if (!currentLabels.includes(label)) {
      await chatwoot.post(
        `/accounts/${ACCOUNT_ID}/conversations/${conversationId}/labels`,
        { labels: [...currentLabels, label] }
      );
    }
  } catch (err: any) {
    console.error('Chatwoot label error:', err.message);
  }
}

/**
 * Assign conversation to a team
 */
export async function assignToTeam(conversationId: string, teamId: number) {
  try {
    await chatwoot.patch(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}/assignments`,
      { team_id: teamId }
    );
  } catch (err: any) {
    console.error('Chatwoot assign team error:', err.message);
  }
}

/**
 * Search for a contact by identifier (telegram_id)
 */
export async function findContactByTelegramId(telegramId: number) {
  try {
    const { data } = await chatwoot.get(
      `/accounts/${ACCOUNT_ID}/contacts/search?q=${telegramId}`
    );
    return data.payload?.length > 0 ? data.payload[0] : null;
  } catch {
    return null;
  }
}
```

---

After a **HIGH** user confirms in `/confirm-intent`, the Next.js app sends the Telegram lead messages, resolves the mirrored Chatwoot conversation (see `findLatestConversationIdForTelegramUser` in `lib/chatwoot.ts`), then applies labels `qualified-lead`, `product-<tier>`, `deposit-pending` and assigns the **Closers** team when `CHATWOOT_CLOSERS_TEAM_ID` is set. Chatwoot **automation rules** on message content (e.g. `[GTMO QUALIFIED LEAD]`) can remain as a backup.

---

## Chatwoot Automation Rules to Configure

Go to: Chatwoot → Settings → Automation → New Automation

### Rule 1: Tag and assign qualified leads

```
Name: Route Mini App Qualified Leads

Trigger: Conversation Created

Conditions:
  - Inbox: Mini App Leads
  - Message Content: contains [GTMO QUALIFIED LEAD]

Actions:
  - Add Label: qualified-lead
  - Assign a Team: Closers
```

### Rule 2: High priority flag for HIGH segment

```
Name: Flag High Intent Leads

Trigger: Conversation Created

Conditions:
  - Inbox: Mini App Leads
  - Message Content: contains 🔴

Actions:
  - Add Label: qualified-lead
  - Assign a Team: Closers
  - Send a Message (private note): "🔴 HIGH INTENT — contact within 5 minutes"
```

### Rule 3: Auto-reply for support bot inbound (noise control)

```
Name: Support Bot Auto-Reply

Trigger: Conversation Created

Conditions:
  - Inbox: Support Bot (the channel-facing one)
  - Message Content: does not contain [GTMO QUALIFIED LEAD]

Actions:
  - Send a Message: "To apply for access to our live trading community, tap below:"
    [Include your mini app link in the message]
```

---

## Quick Replies to Create

Go to: Chatwoot → Settings → Quick Reply → Add

### /dep50
```
Title: dep50
Content:
Great news! Your Ebook access has been activated. 📚

Here's your download link: [EBOOK_LINK]

This was unlocked through your deposit with Vantage. If you have any questions about the content, I'm here to help.

[MINI APP USER BONUS]: When you're ready for your next step, you'll have 10% off your next product.
```

### /dep100
```
Title: dep100
Content:
You're now a VIP member! 🎉

Your VIP signals access: [VIP_GROUP_LINK]
Your Ebook (included as mini app bonus): [EBOOK_LINK]

Both are now active on your account. Welcome to the inner circle.
```

### /dep200
```
Title: dep200
Content:
Your product access is now live. 

Which product did we confirm?
→ FX Basics: [FXBASICS_LINK]
→ Education: [EDUCATION_LINK]

[MINI APP USER BONUS]: Reply with which second product you'd like at 50% off and I'll get that sorted for you now.
```

### /dep500
```
Title: dep500
Content:
School access is now active. 🎓

Your School link: [SCHOOL_LINK]

[MINI APP USER BONUS]: You're entitled to one additional product of your choice completely free. Which would you like?
• Ebook
• FX Basics  
• Education
• VIP (if not already active)

Just reply with your choice and I'll activate it now.
```

### /dep_check
```
Title: dep_check
Content:
Thanks for getting in touch. To confirm your access, could you let me know:

1. The amount you deposited
2. That it was made through the Vantage link we provided

Once confirmed, I'll activate your products straight away. 
```

---

## Labels Reference

Create all of these in: Chatwoot → Settings → Labels

### Pipeline labels (conversation stage)
| Label | Colour | Use |
|-------|--------|-----|
| qualified-lead | Red | Arrived via mini app, not yet contacted |
| deposit-pending | Yellow | Agent in conversation, deposit not confirmed |
| deposit-confirmed | Green | Deposit verified, products unlocked |
| not-ready | Grey | User said not ready / low intent |

### Product labels (what user owns)
| Label | Use |
|-------|-----|
| product-ebook | Ebook has been sent |
| product-vip | VIP group access given |
| product-fxbasics | FX Basics access given |
| product-education | Education access given |
| product-school | School access given |

---

## Chatwoot Webhook Configuration

To enable the returning user lookup (app/api/chatwoot/webhook):

1. Chatwoot → Settings → Integrations → Webhooks → Add new webhook
2. URL: `https://your-vercel-app.vercel.app/api/chatwoot/webhook`
3. Check: `Conversation Created`, `Message Created`
4. Save

This fires whenever a new conversation opens or a message arrives. Your webhook looks up the telegram_id and adds a context note if the user came through the mini app.
