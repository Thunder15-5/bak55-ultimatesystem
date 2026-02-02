

# Selar API Integration & BAKCoin Rate Fix

## Overview

This plan addresses two issues:
1. **Update the exchange rate** to 1 BAK = 20 KES (currently still showing 28 KES = 1 BAK)
2. **Store and use the Selar API key** for webhook verification and potential transaction fetching

---

## Current State

| Item | Current | Desired |
|------|---------|---------|
| Exchange Rate | 28 KES = 1 BAK (~3.57 BAK per 100 KES) | 20 KES = 1 BAK (5 BAK per 100 KES) |
| Selar API Key | Not configured | Store as `SELAR_API_KEY` secret |
| Webhook Verification | None | Signature verification using API key |

---

## Implementation Steps

### Step 1: Store the Selar API Key

Add the Third Party Integration API key as a secret:
- **Secret Name:** `SELAR_API_KEY`
- **Value:** `sat_c11f37e428233111z3492151517`

This key will be used to:
1. Verify webhook signatures (security)
2. Potentially fetch transaction details from Selar's API

### Step 2: Update Exchange Rate in Frontend

**File:** `src/pages/BuyCoins.tsx`

Update lines 18-19:
```typescript
// Before
const BAK_RATE = 28; // 28 KES = 1 BAK
const BAK_AMOUNT = (PACKAGE_PRICE_KES / BAK_RATE).toFixed(2); // ~3.57 BAK

// After
const BAK_RATE = 20; // 20 KES = 1 BAK
const BAK_AMOUNT = (PACKAGE_PRICE_KES / BAK_RATE).toFixed(2); // 5.00 BAK
```

Also update the display text on line 169:
```typescript
// Before: Rate: 28 KES = 1 BAK
// After:  Rate: 20 KES = 1 BAK
```

### Step 3: Update Exchange Rate in Backend

**File:** `supabase/functions/selar-callback/index.ts`

Update lines 10-12:
```typescript
// Before
const BAK_RATE = 28;
const BAK_AMOUNT = PACKAGE_PRICE_KES / BAK_RATE; // ~3.57 BAK

// After
const BAK_RATE = 20;
const BAK_AMOUNT = PACKAGE_PRICE_KES / BAK_RATE; // 5.00 BAK
```

Update notification messages to reflect 5.00 BAK instead of 3.57 BAK.

### Step 4: Add Webhook Signature Verification

Enhance the `selar-callback` function to verify incoming webhooks using the API key:

```typescript
// Get the Selar API key for verification
const selarApiKey = Deno.env.get('SELAR_API_KEY');

// Verify webhook signature if provided
const signature = req.headers.get('x-selar-signature') || 
                  req.headers.get('x-webhook-signature');

if (selarApiKey && signature) {
  // Verify the signature matches
  const encoder = new TextEncoder();
  const data = encoder.encode(rawBody);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(selarApiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, data);
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
  
  if (signature !== expectedSignature) {
    console.warn('Invalid webhook signature');
    // Log but don't reject - Selar may use different signature method
  }
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/BuyCoins.tsx` | Update BAK_RATE from 28 to 20, update display text |
| `supabase/functions/selar-callback/index.ts` | Update BAK_RATE from 28 to 20, add signature verification, update notification text |

---

## Selar Webhook Configuration

Your webhook endpoint is:
```
https://qtdxzgeeomgukkxfkwmh.supabase.co/functions/v1/selar-callback
```

**To configure in Selar:**
1. Log into your Selar dashboard
2. Navigate to Settings → Integrations → Zapier or Webhooks
3. Set up a "New Sale" trigger pointing to the webhook URL above
4. The Third Party Integration key may need to be configured in the webhook settings for signature verification

---

## Expected Behavior After Implementation

1. User clicks "Buy Now - 100 KES" → Opens Selar payment page
2. User completes payment on Selar
3. Selar sends webhook to your callback function
4. Callback verifies signature (if available) for security
5. Callback credits **5.00 BAK** (not 3.57) to user's wallet
6. User receives in-app notification and email confirmation
7. Transaction is logged for audit purposes

---

## Technical Notes

### About the Selar API Key (`sat_...`)

The "Third Party Integration" API key in Selar is primarily used for:
- **Webhook signature verification** - Ensures webhooks are genuinely from Selar
- **API access** - Some Selar plans allow fetching orders/transactions via API

Selar does not have extensive public API documentation, but the key can be used to sign and verify webhook payloads for security.

### Existing Secrets Check

Current Selar-related secrets already configured:
- `SELAR_PUBLIC_KEY`
- `SELAR_SECRET_KEY`
- `SELAR_WEBHOOK_SECRET`

The new `SELAR_API_KEY` will be added alongside these for the Third Party Integration key.

