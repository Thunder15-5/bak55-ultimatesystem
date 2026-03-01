

## Plan: Fix Logo + Update BAKCoin Rate to $0.16 + Add Exchange Rate Table

### 1. Fix Logo Not Showing

The logo file `src/assets/bak55-logo.png` exists and is imported correctly in code. The issue is likely the actual image file being corrupted or empty. I'll need to verify the file loads in the preview. If it's a build/asset issue, we may need to move it to the `public` folder and reference it via URL instead of ES module import across all 9 files that use it.

**Approach**: Change all logo references from ES module import (`import logo from "@/assets/bak55-logo.png"`) to a public path (`/favicon.png` or copy the logo to `public/bak55-logo.png`), which is more reliable for deployed builds.

**Files affected**: `Navbar.tsx`, `Navigation.tsx`, `Footer.tsx`, `Login.tsx`, `Signup.tsx`, `VerifyAccount.tsx`, `VerifyEmail.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`

### 2. Update BAKCoin Exchange Rate: 1 BAK = $0.16

Update all hardcoded references from `$0.20` and `1 BAK = 20 KES` to `$0.16` across:

| File | Change |
|------|--------|
| `src/pages/BAKCoins.tsx` | `$0.20 USD` → `$0.16 USD` |
| `src/pages/Terms.tsx` | `$0.20 USD` → `$0.16 USD` |
| `src/pages/Support.tsx` | `$0.20 USD` → `$0.16 USD` |
| `src/pages/FAQ.tsx` | `$0.20 USD` → `$0.16 USD` |
| `src/pages/blogData.ts` | All `1 BAK = 20 KES` → `1 BAK = $0.16 USD` (5 occurrences) |
| `src/pages/admin/CashReserve.tsx` | `totalBAK * 20` → `totalBAK * 0.16` (USD base) |
| `src/components/admin/SalesPanel.tsx` | Label update `1 BAK = X KES` → `1 BAK = X USD` |

### 3. Add Exchange Rates Display Table

Create a reusable `ExchangeRatesTable` component showing live rates for all supported currencies. Display it on:

- **BAKCoins page** — below the hero showing 1 BAK equivalent in all currencies
- **Wallet page** — sidebar/card showing current rates
- **BuyCoins page** — reference rates for purchases

The table will pull from the `useCurrency` hook's `rates` data and show:
```
Currency  | 1 BAK Value
KES       | KSh 20.72
NGN       | ₦ 246.40
GHS       | GH₵ 2.35
...
```

### 4. Update Backend Email Templates

Update `supabase/functions/send-email/index.ts` to remove hardcoded KES references in email templates for withdrawals and deposits.

### Summary of Files to Create/Modify

- **Create**: `src/components/ExchangeRatesTable.tsx`
- **Modify** (logo fix): 9 files
- **Modify** (rate update): 7 files  
- **Modify** (add rates table): `BAKCoins.tsx`, `Wallet.tsx`, `BuyCoins.tsx`
- **Modify** (emails): `send-email/index.ts`

