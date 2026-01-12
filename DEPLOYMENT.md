# Deployment Guide: GitHub + Vercel

This guide explains how to deploy your BAK55 Music Platform to Vercel using GitHub Actions for CI/CD.

## Prerequisites

- A GitHub account with this repository pushed
- A Vercel account (free tier works)

## Step 1: Connect GitHub to Vercel

### Option A: Automatic (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the Vite framework
5. Add environment variables (see Step 2)
6. Click "Deploy"

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link your project (run from project root)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Step 2: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Production, Preview |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key | Production, Preview |
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID | Production, Preview |

## Step 3: Configure GitHub Secrets (for CI/CD)

In GitHub → Repository → Settings → Secrets and variables → Actions, add:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Get from Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Get from Vercel → Settings → General → Your ID |
| `VERCEL_PROJECT_ID` | Get from Vercel → Project → Settings → General |
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID |

### Getting Vercel Credentials

1. **VERCEL_TOKEN**: Go to Vercel → Settings → Tokens → Create Token
2. **VERCEL_ORG_ID**: Go to Vercel → Settings → General → "Your ID"
3. **VERCEL_PROJECT_ID**: Go to Vercel → Your Project → Settings → General → "Project ID"

## Step 4: CI/CD Pipeline

The `.github/workflows/deploy.yml` file automatically:

1. **On Pull Request**: Runs lint + build → Deploys to preview URL
2. **On Push to main**: Runs lint + build → Deploys to production

## Local Testing

Before deploying, test the production build locally:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Serve the production build locally
npx serve dist/

# Or use Vite preview
npm run preview
```

## Troubleshooting

### Build Fails

1. Ensure all dependencies are in `package.json`
2. Check for TypeScript errors: `npx tsc --noEmit`
3. Run lint: `npm run lint`

### Environment Variables Not Working

1. Ensure variables start with `VITE_` for client-side access
2. Redeploy after adding new env vars
3. Check Vercel build logs for missing variables

### 404 on Page Refresh

The `vercel.json` includes rewrites for SPA routing. If still seeing 404s:
- Verify `vercel.json` is at the project root
- Check the rewrites configuration

### Favicon Not Updating

Clear browser cache and Vercel CDN cache:
- Vercel Dashboard → Deployments → Redeploy (without cache)

## Project Structure for Deployment

```
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD pipeline
├── public/
│   ├── _redirects          # Netlify fallback
│   ├── manifest.json       # PWA manifest
│   ├── favicon.png         # App icon
│   └── robots.txt          # SEO
├── dist/                   # Build output (gitignored)
├── vercel.json             # Vercel configuration
├── vite.config.ts          # Vite build config
└── .nvmrc                  # Node version
```

## Performance Optimizations

The deployment includes:

- **Code Splitting**: Routes are lazy-loaded
- **Asset Caching**: Long cache headers for static assets
- **PWA Support**: Service worker for offline capability
- **CDN**: Vercel Edge Network for global distribution

## Custom Domains

1. Go to Vercel → Project → Settings → Domains
2. Add your domain (e.g., `app.bak55.com`)
3. Configure DNS at your registrar:
   - CNAME record: `@ → cname.vercel-dns.com`
   - Or A record: `@ → 76.76.21.21`

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
