# Pesapal IPN Proxy Setup Guide

## The Problem

Pesapal requires your IPN callback URL to be on the same domain as your registered merchant account (`www.bak55talent.co.ke`), but your backend edge functions are hosted on Supabase's domain.

## Solution: Proxy Endpoint

Create a lightweight proxy at `https://www.bak55talent.co.ke/api/pesapal/callback` that forwards requests to your Supabase edge function.

---

## Option 1: Cloudflare Worker (Recommended)

**Free tier available, takes ~10 minutes**

### Step 1: Create Cloudflare Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages
2. Click "Create Application" → "Create Worker"
3. Name it: `pesapal-proxy`
4. Replace the default code with:

```javascript
export default {
  async fetch(request) {
    // Only allow POST requests
    if (request.method !== 'POST' && request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const supabaseUrl = 'https://qtdxzgeeomgukkxfkwmh.supabase.co/functions/v1/pesapal-callback';

    try {
      // Forward the request to Supabase edge function
      const response = await fetch(supabaseUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method === 'POST' ? await request.text() : undefined,
      });

      // Return the response from Supabase
      return new Response(await response.text(), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(JSON.stringify({ error: 'Proxy failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
```

### Step 2: Add Custom Route

1. In your Cloudflare Worker settings, go to "Triggers" → "Routes"
2. Click "Add Route"
3. Route: `www.bak55talent.co.ke/api/pesapal/callback`
4. Zone: Select `bak55talent.co.ke`
5. Save

### Step 3: Register with Pesapal

Now register this URL with Pesapal:

```bash
curl --location 'https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
  "url": "https://www.bak55talent.co.ke/api/pesapal/callback",
  "ipn_notification_type": "POST"
}'
```

✅ Save the `ipn_id` from the response as your `PESAPAL_NOTIFICATION_ID` secret.

---

## Option 2: Vercel Serverless Function

If you prefer Vercel (also free tier):

### Step 1: Create Vercel Project

1. Create a new folder: `pesapal-proxy`
2. Create `api/pesapal-callback.js`:

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = 'https://qtdxzgeeomgukkxfkwmh.supabase.co/functions/v1/pesapal-callback';

  try {
    const response = await fetch(supabaseUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed' });
  }
}
```

### Step 2: Deploy to Vercel

```bash
npm i -g vercel
cd pesapal-proxy
vercel --prod
```

### Step 3: Add Custom Domain

1. In Vercel dashboard → Settings → Domains
2. Add `www.bak55talent.co.ke`
3. Follow DNS instructions
4. Access at: `https://www.bak55talent.co.ke/api/pesapal-callback`

---

## Option 3: Netlify Function

Similar to Vercel but using Netlify's serverless functions.

---

## Testing Your Proxy

After setup, test that your proxy works:

```bash
# Test the proxy endpoint
curl -X POST https://www.bak55talent.co.ke/api/pesapal/callback \
  -H "Content-Type: application/json" \
  -d '{
    "OrderTrackingId": "test-123",
    "OrderMerchantReference": "test-ref"
  }'
```

Should return the same response as calling the Supabase function directly.

---

## Flow After Setup

```
Pesapal IPN Notification
  ↓
https://www.bak55talent.co.ke/api/pesapal/callback (Your Domain - Pesapal Happy ✅)
  ↓
Cloudflare Worker / Vercel Function (Proxy)
  ↓
https://qtdxzgeeomgukkxfkwmh.supabase.co/functions/v1/pesapal-callback (Your Backend)
  ↓
Process Payment & Credit Wallet
```

---

## Why This Works

1. ✅ Pesapal sees a callback URL on your registered domain
2. ✅ Your backend stays on Supabase (no migration needed)
3. ✅ Simple, lightweight proxy with minimal overhead
4. ✅ Free tier available on all platforms
5. ✅ Easy to monitor and debug

---

## Troubleshooting

### Proxy not working?
- Check Cloudflare Worker logs in dashboard
- Verify the route is configured correctly
- Test the Supabase endpoint directly first

### Still getting domain error?
- Ensure your merchant account domain exactly matches the proxy URL domain
- Check for `www` vs non-www differences
- Verify DNS is propagated

### Payments not crediting?
- Check Supabase edge function logs
- Verify `PESAPAL_NOTIFICATION_ID` is set correctly
- Test the full flow end-to-end

---

## Next Steps

1. ✅ Set up proxy (Cloudflare Worker recommended - 10 minutes)
2. ✅ Register IPN URL with Pesapal using your domain
3. ✅ Update `PESAPAL_NOTIFICATION_ID` secret
4. ✅ Test payment flow end-to-end
5. ✅ Monitor logs for first few transactions

**Estimated time: 15-20 minutes total**
