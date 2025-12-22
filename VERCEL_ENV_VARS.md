# Vercel Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables** for **Production**, **Preview**, and **Development**:

## Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pidopvklxjmmlfutkrhd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZG9wdmtseGptbWxmdXRrcmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDE5NTQsImV4cCI6MjA4MTk3Nzk1NH0.j3Gf1T2MKe_JLtPBdMm_hs-PL8r2fmWC7AiHs8VDbyk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZG9wdmtseGptbWxmdXRrcmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQwMTk1NCwiZXhwIjoyMDgxOTc3OTU0fQ.TaDzgSun5y5O9RKNh3IKU3XFSVq73MSQUMJW_cV3QMk

# Google OAuth (Update GOOGLE_REDIRECT_URI with your Vercel domain)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/google/callback
```

## Important Notes

1. **Replace `your-vercel-domain`** with your actual Vercel deployment URL
2. All variables must be set for **Production**, **Preview**, and **Development** environments
3. After adding variables, **redeploy** the project for changes to take effect
4. The `NEXT_PUBLIC_*` variables are exposed to the browser, others are server-only
5. Update `GOOGLE_REDIRECT_URI` in Google Cloud Console to match your Vercel URL

## How to Add Variables in Vercel

1. Go to your project: https://vercel.com/dashboard
2. Select your project → **Settings** → **Environment Variables**
3. For each variable:
   - Enter **Name** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter **Value** (paste the value from above)
   - Select **Production**, **Preview**, and **Development**
   - Click **Save**
4. After adding all variables, trigger a new deployment

## Troubleshooting

If build still fails:
- Verify all env vars are set correctly (no typos)
- Check that values don't have extra quotes or spaces
- Ensure you clicked "Save" for each variable
- Redeploy from the Deployments tab
