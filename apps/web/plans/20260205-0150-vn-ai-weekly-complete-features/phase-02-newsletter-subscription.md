# Phase 02: Newsletter Subscription

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: None (independent)
- **Blocks**: None

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-05 |
| Priority | P0 |
| Status | Pending |
| Estimate | 2 hours |

Implement newsletter subscription API with Resend for email delivery, Supabase for subscriber storage, and double opt-in flow.

## Key Insights (from Research)

1. **Provider**: Resend - developer-first API, React Email templates, good deliverability
2. **Double Opt-in**: Mandatory to prevent spam traps
3. **Storage**: Supabase PostgreSQL `subscribers` table
4. **UI**: Already exists in SubscribeSection.tsx, just needs API

## Requirements

### Must Have
- POST `/api/subscribe` - accept email, store pending, send confirmation
- GET `/api/confirm?token=...` - verify token, activate subscription
- Supabase `subscribers` table with status enum
- Resend integration for confirmation email

### Nice to Have
- Rate limiting on subscribe endpoint
- Unsubscribe link in emails

## Architecture

```
Subscribe Flow:
1. User submits email -> POST /api/subscribe
2. API creates subscriber (status: pending) with token
3. API sends confirmation email via Resend
4. User clicks link -> GET /api/confirm?token=xxx
5. API updates subscriber (status: active)

Database Schema:
subscribers
├── id (uuid, pk)
├── email (text, unique)
├── status (enum: pending, active, unsubscribed)
├── confirm_token (text, nullable)
├── created_at (timestamp)
└── confirmed_at (timestamp, nullable)
```

## Related Code Files

| File | Purpose |
|------|---------|
| `/src/components/blog/SubscribeSection.tsx` | Existing UI - calls `/api/subscribe` |
| `.env.example` | Needs RESEND_API_KEY added |

## Implementation Steps

### Step 1: Add Resend Dependency
```bash
pnpm add resend
```

### Step 2: Create Supabase Migration
```sql
-- supabase/migrations/001_subscribers.sql
CREATE TYPE subscriber_status AS ENUM ('pending', 'active', 'unsubscribed');

CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status subscriber_status DEFAULT 'pending',
  confirm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_token ON subscribers(confirm_token);
```

### Step 3: Create Resend Client
```tsx
// src/lib/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendConfirmationEmail(email: string, token: string) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/confirm?token=${token}`

  await resend.emails.send({
    from: 'VN AI Weekly <noreply@yourdomain.com>',
    to: email,
    subject: 'Xác nhận đăng ký VN AI Weekly',
    html: `
      <p>Cảm ơn bạn đã đăng ký!</p>
      <p><a href="${confirmUrl}">Click để xác nhận</a></p>
    `,
  })
}
```

### Step 4: Create Subscribe API Route
```tsx
// src/app/api/subscribe/route.ts
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { randomBytes } from 'crypto'
import { sendConfirmationEmail } from '@/lib/resend'

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
  }

  const token = randomBytes(32).toString('hex')

  // Insert into Supabase via direct query or create Subscribers collection
  // Send confirmation email
  await sendConfirmationEmail(email, token)

  return NextResponse.json({ message: 'Vui lòng kiểm tra email để xác nhận' })
}
```

### Step 5: Create Confirm API Route
```tsx
// src/app/api/confirm/route.ts
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token missing' }, { status: 400 })
  }

  // Find subscriber by token, update status to active
  // Redirect to success page

  return redirect('/blog?subscribed=true')
}
```

## Todo List

- [ ] Add `resend` package dependency
- [ ] Add `RESEND_API_KEY` to `.env.example`
- [ ] Create Supabase migration for `subscribers` table
- [ ] Create `src/lib/resend.ts` - Resend client wrapper
- [ ] Create `src/app/api/subscribe/route.ts` - subscription endpoint
- [ ] Create `src/app/api/confirm/route.ts` - confirmation endpoint
- [ ] Test end-to-end subscription flow
- [ ] Verify Cloudflare Workers compatibility

## Success Criteria

- [ ] Submitting email creates pending subscriber in database
- [ ] Confirmation email sent via Resend
- [ ] Clicking confirm link activates subscription
- [ ] Duplicate emails handled gracefully
- [ ] Works on Cloudflare Workers deployment

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Resend incompatible with CF Workers | Medium | High | Test early; fallback to Cloudflare Email Workers |
| Email deliverability issues | Low | Medium | Use verified domain, monitor bounces |
| Token collision | Very Low | Low | 32-byte random token statistically unique |

## Security Considerations

- Validate email format server-side
- Use cryptographically random tokens
- Rate limit subscribe endpoint (prevent enumeration)
- Tokens expire after 24 hours (consider adding expiry field)
- Never expose whether email exists in error messages

## Next Steps

After completion:
1. Consider adding email templates with React Email
2. Add unsubscribe endpoint for compliance
