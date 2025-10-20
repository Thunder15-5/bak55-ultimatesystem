# Pesapal Integration Setup Guide

## 🔴 CRITICAL ISSUE - PAYMENT BLOCKED

**Problem:** Payment initiation is failing because `PESAPAL_NOTIFICATION_ID` is set to a URL instead of an IPN ID.

**Current Value (WRONG):** `https://bak55talent.co.ke/pesapal/callback`  
**Required Value:** An IPN ID (UUID) like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Impact:** All payment attempts are failing. Users cannot buy BAKCoins.

---

## ⚡ IMMEDIATE FIX REQUIRED (30 minutes)

### Step 1: Get Pesapal Access Token

```bash
curl --location 'https://pay.pesapal.com/v3/api/Auth/RequestToken' \
--header 'Content-Type: application/json' \
--data '{
  "consumer_key": "YOUR_PESAPAL_CONSUMER_KEY",
  "consumer_secret": "YOUR_PESAPAL_CONSUMER_SECRET"
}'
```

**Save the `token` from the response.**

### Step 2: Register IPN URL with Pesapal

⚠️ **CRITICAL - DOMAIN RESTRICTION FOUND:**

Pesapal **REQUIRES** the IPN URL domain to match your merchant account domain exactly.

**If your merchant account is registered as `www.bak55talent.co.ke`:**
- ❌ You CANNOT use: `qtdxzgeeomgukkxfkwmh.supabase.co`
- ❌ You CANNOT use: `app.bak55talent.co.ke`
- ✅ You MUST use: `www.bak55talent.co.ke`

**Solution Required:**
You need to set up a simple proxy on your domain that forwards to Supabase.

👉 **See `PESAPAL_PROXY_SETUP.md` for complete setup instructions (15 minutes)**

After setting up the proxy, register your IPN URL:

```bash
curl --location 'https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN_FROM_STEP_1' \
--header 'Content-Type: application/json' \
--data '{
  "url": "https://www.bak55talent.co.ke/api/pesapal/callback",
  "ipn_notification_type": "POST"
}'
```

**Response will look like:**
```json
{
  "ipn_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "url": "https://www.bak55talent.co.ke/api/pesapal/callback",
  "created_date": "2025-10-19T..."
}
```

### Step 3: Update the Secret

1. Copy the `ipn_id` from the response (NOT the url)
2. Update your `PESAPAL_NOTIFICATION_ID` secret with this IPN ID
3. The value should be just the UUID, like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Step 4: Test Payment

1. Go to `/wallet` → Click "Buy BAKCoins"
2. Enter amount (minimum 100 KSh)
3. Click "Proceed to Payment"
4. Should redirect to Pesapal payment page ✅
5. Complete payment
6. Should credit wallet automatically ✅

---

## Current Status
The Pesapal payment integration is fully implemented in code. However, to make it work in production, you need to complete the following setup steps with Pesapal.

## Required Setup Steps

### 1. Set Up Proxy & Register IPN URL

Due to Pesapal's domain restriction, you need to:
1. **Set up a proxy** on your domain - See `PESAPAL_PROXY_SETUP.md` (15 min)
2. **Register your domain's IPN URL** with Pesapal (not the Supabase URL directly)

**IPN URL to register (after proxy setup):**
```
https://www.bak55talent.co.ke/api/pesapal/callback
```

This proxy will forward requests to:
```
https://qtdxzgeeomgukkxfkwmh.supabase.co/functions/v1/pesapal-callback
```

**Steps:**
1. Complete proxy setup from `PESAPAL_PROXY_SETUP.md`
2. Register the proxy URL with Pesapal (get IPN ID)
3. Add the IPN ID to your Lovable secrets as `PESAPAL_NOTIFICATION_ID`

### 2. Verify Your Pesapal Credentials
Ensure these secrets are correctly set in your Lovable Cloud:
- `PESAPAL_CONSUMER_KEY` - Your Pesapal API consumer key
- `PESAPAL_CONSUMER_SECRET` - Your Pesapal API consumer secret
- `PESAPAL_NOTIFICATION_ID` - The IPN ID from step 1

### 3. Test the Integration

#### Test Payment Flow:
1. Go to `/wallet/buy-coins`
2. Enter an amount (minimum 100 KSh)
3. Click "Proceed to Payment"
4. Complete payment on Pesapal
5. You'll be redirected back to the app
6. Pesapal will call your IPN URL to confirm payment
7. BAKCoins should be credited automatically

#### Monitor Logs:
Check edge function logs for `pesapal-callback` to see if Pesapal is calling your IPN URL.

### 4. Production Checklist
- [ ] IPN URL registered with Pesapal
- [ ] PESAPAL_NOTIFICATION_ID secret added
- [ ] Test successful payment flow
- [ ] Test failed payment handling
- [ ] Verify BAKCoins credit correctly
- [ ] Check admin approval flow works
- [ ] Verify email notifications sent

## Payment Flow Overview

```
User → Buy Coins Page
  ↓
Initiate Payment (pesapal-initiate)
  ↓
Redirect to Pesapal Gateway
  ↓
User Completes Payment
  ↓
Pesapal IPN → www.bak55talent.co.ke/api/pesapal/callback (Proxy)
  ↓
Proxy forwards to → Supabase Edge Function (pesapal-callback)
  ↓
Update Transaction Status
  ↓
Credit BAKCoins to Wallet
  ↓
Send Confirmation Email (optional)
  ↓
User Returns to Success Page
```

## Admin Manual Verification
If automatic crediting fails, admins can:
1. Go to `/admin/cash-reserve`
2. View "Pending Coin Purchases"
3. Click "Approve" to manually credit BAKCoins
4. Or use `/functions/v1/verify-pesapal-payment` with transaction ID

## Troubleshooting

### Payment not crediting automatically?
1. Check if IPN URL is registered
2. View edge function logs for `pesapal-callback`
3. Verify PESAPAL_NOTIFICATION_ID is set
4. Use admin manual approval as backup

### Transaction shows as pending?
- Pesapal may not have called IPN yet
- Admin can manually verify via Cash Reserve page
- Or use verify-pesapal-payment endpoint

### Need to refund?
Currently handled manually:
1. Admin marks transaction as failed
2. No BAKCoins are credited
3. User contacts support for refund processing
