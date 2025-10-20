# Pesapal Integration Setup Guide

Complete guide for setting up Pesapal payment gateway on BAK55 Talent Platform.

## Overview

This integration enables users to purchase BAKCoins using:
- M-Pesa
- Airtel Money
- Credit/Debit Cards
- Bank Transfers

## Prerequisites

1. **Pesapal Account** - Register at [pesapal.com](https://www.pesapal.com)
2. **Domain** - www.bak55talent.co.ke (must be registered in Pesapal)
3. **Cloudflare Account** - For IPN proxy (free tier works)

## Phase 1: Pesapal Account Configuration (30 mins)

### Step 1: Get API Credentials

1. Login to Pesapal Dashboard
2. Navigate to **Settings** → **API Credentials**
3. Copy the following:
   - **Consumer Key**
   - **Consumer Secret**
4. Choose your environment:
   - **Sandbox** (for testing): https://cybqa.pesapal.com
   - **Production** (for live): https://pay.pesapal.com

### Step 2: Register IPN URL

**CRITICAL**: Pesapal requires the IPN URL to be on your registered domain.

1. Go to **Settings** → **IPN Settings** in Pesapal Dashboard
2. Click **Register IPN URL**
3. Enter: `https://www.bak55talent.co.ke/api/pesapal-callback`
4. Set notification type: **POST**
5. Save and copy the **IPN ID** (UUID format, e.g., `12345678-1234-...`)

**⚠️ Important**: The IPN ID is a UUID, NOT the URL itself. Don't confuse these!

### Step 3: Set Environment Variables in Lovable Cloud

In Lovable Cloud backend settings, add these secrets:

```
PESAPAL_CONSUMER_KEY = your_consumer_key_here
PESAPAL_CONSUMER_SECRET = your_consumer_secret_here
PESAPAL_NOTIFICATION_ID = your_ipn_uuid_here
PESAPAL_ENVIRONMENT = sandbox (or "live" for production)
```

## Phase 2: Cloudflare Worker Proxy Setup (20 mins)

Since Pesapal requires the IPN URL on your domain, we use a Cloudflare Worker as a proxy.

### Create Cloudflare Worker

1. Login to Cloudflare Dashboard
2. Go to **Workers & Pages** → **Create Application** → **Create Worker**
3. Name it: `pesapal-callback-proxy`
4. Replace the default code with:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Forward to Supabase edge function
  const url = new URL(request.url)
  const supabaseUrl = 'https://qtdxzgeeomgukkxfkwmh.supabase.co/functions/v1/pesapal-callback' + url.search
  
  console.log('Proxying request to:', supabaseUrl)
  
  try {
    const response = await fetch(supabaseUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: request.method !== 'GET' ? await request.text() : undefined
    })
    
    const responseText = await response.text()
    console.log('Response from Supabase:', responseText)
    
    return new Response(responseText, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

5. Click **Save and Deploy**

### Add Route to Domain

1. Go to **Workers Routes** (under Workers & Pages)
2. Click **Add Route**
3. Route: `www.bak55talent.co.ke/api/pesapal-callback*`
4. Worker: Select `pesapal-callback-proxy`
5. Save

### Test the Proxy

```bash
curl https://www.bak55talent.co.ke/api/pesapal-callback?test=1
```

You should get a response from the Supabase function.

## Phase 3: Testing (1 hour)

### Test in Sandbox Mode

1. **Make sure** `PESAPAL_ENVIRONMENT` is set to `sandbox`
2. Go to `/wallet/buy-coins` on your app
3. Enter amount: 100 KSh (minimum)
4. Click "Buy BAKCoins"
5. You'll be redirected to Pesapal sandbox payment page

### Test Payment Methods

**Sandbox Test Credentials:**

**M-Pesa (Test):**
- Phone: Any Kenyan number
- Use test M-Pesa credentials provided by Pesapal

**Cards (Test):**
```
Card Number: 4000000000000002
Expiry: Any future date
CVV: 123
```

### Verify Flow

1. Complete payment on Pesapal page
2. IPN is sent to: `www.bak55talent.co.ke/api/pesapal-callback`
3. Cloudflare Worker forwards to: Supabase edge function
4. Edge function:
   - Verifies payment with Pesapal API
   - Updates payment_transactions table
   - Credits user wallet
   - Creates transaction record
5. User is redirected to success page
6. Wallet balance updates automatically

### Check Logs

**Cloudflare Worker Logs:**
- Go to Worker → **Logs** tab
- Check for incoming IPN requests

**Supabase Edge Function Logs:**
- Open Lovable Cloud backend
- Go to Edge Functions → `pesapal-callback`
- Check logs for:
  - IPN received
  - Payment status fetched
  - Wallet credited

## Phase 4: Production Deployment

### Switch to Production

1. Update `PESAPAL_ENVIRONMENT` to `live` in secrets
2. **Register IPN URL again** in Pesapal production dashboard
3. Get **new production credentials**:
   - Production Consumer Key
   - Production Consumer Secret
   - Production IPN ID
4. Update secrets with production values

### Go Live Checklist

- [ ] Production Pesapal account approved
- [ ] Domain verified in Pesapal
- [ ] IPN URL registered in production
- [ ] Production secrets configured
- [ ] Cloudflare Worker tested
- [ ] Test successful payment flow
- [ ] Monitor first 10 transactions closely

## Troubleshooting

### Payment Stuck in "Pending"

**Solution 1: Automatic Retry**
- IPN might be delayed
- System will retry verification automatically

**Solution 2: Manual Verification**
1. Go to `/admin` → **Purchases** tab
2. Find the pending transaction
3. Click **Verify** button
4. Admin panel will fetch latest status from Pesapal

**Solution 3: Use Transaction ID**
1. Copy Transaction ID or OrderTrackingId
2. Go to Manual Verification section
3. Paste ID and click "Verify Payment"

### IPN Not Received

**Check 1: Cloudflare Worker**
```bash
curl https://www.bak55talent.co.ke/api/pesapal-callback?OrderTrackingId=test123
```

**Check 2: Direct Edge Function**
```bash
curl https://qtdxzgeeomgukkxfkwmh.supabase.co/functions/v1/pesapal-callback?OrderTrackingId=test123 \
  -H "Content-Type: application/json"
```

**Check 3: Pesapal IPN Registration**
- Login to Pesapal Dashboard
- Verify IPN URL is registered correctly
- Check IPN notification history

### Payment Shows "Failed" but Money Deducted

1. Check Pesapal transaction status in dashboard
2. If actually successful, use manual verification
3. Contact Pesapal support with OrderTrackingId

### Domain Mismatch Error

**Error**: "IPN URL domain doesn't match registered domain"

**Fix**:
1. Verify domain is registered in Pesapal
2. IPN URL must be: `https://www.bak55talent.co.ke/api/pesapal-callback`
3. Not a subdomain or different domain

## Architecture

```
User → Frontend (BuyCoins page)
  ↓
Supabase Edge Function (pesapal-initiate)
  ↓
Pesapal API (Submit Order)
  ↓
User → Pesapal Payment Page
  ↓
Pesapal → IPN Callback
  ↓
www.bak55talent.co.ke/api/pesapal-callback (Cloudflare Worker)
  ↓
Supabase Edge Function (pesapal-callback)
  ↓
Verify Payment → Credit Wallet → Redirect User
```

## Security Notes

1. **Never expose secrets** in frontend code
2. **Edge functions** handle all Pesapal API calls
3. **JWT verification** enabled for `pesapal-initiate` and `pesapal-verify`
4. **No JWT** for `pesapal-callback` (external IPN)
5. **RLS policies** protect all database tables
6. **Idempotent** IPN handling prevents double-crediting

## Support

- **Pesapal Support**: support@pesapal.com
- **Documentation**: https://developer.pesapal.com
- **Platform Issues**: Check Supabase logs first

## Quick Reference

**Endpoints:**
- Initiate: `POST /functions/v1/pesapal-initiate`
- Callback: `POST /functions/v1/pesapal-callback`
- Verify: `POST /functions/v1/pesapal-verify`

**Exchange Rate:**
- 20 KSh = 1 BAK
- Minimum: 100 KSh (5 BAK)

**Payment Methods:**
- M-Pesa
- Airtel Money
- Visa/Mastercard
- Bank Transfer
