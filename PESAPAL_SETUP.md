# Pesapal Integration Setup Guide

## Current Status
The Pesapal payment integration is fully implemented in code. However, to make it work in production, you need to complete the following setup steps with Pesapal.

## Required Setup Steps

### 1. Register IPN (Instant Payment Notification) URL
You need to register your callback URL with Pesapal so they can notify your system when payment status changes.

**IPN URL to register:**
```
https://qtdxzgeeomgukkxfkwmh.supabase.co/functions/v1/pesapal-callback
```

**How to register:**
1. Log in to your Pesapal dashboard: https://www.pesapal.com
2. Navigate to Settings > IPN Settings
3. Add the IPN URL above
4. Save the IPN ID that Pesapal generates
5. Add the IPN ID to your Lovable secrets as `PESAPAL_NOTIFICATION_ID`

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
Pesapal Callback (IPN) → pesapal-callback function
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
