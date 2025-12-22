# Pre-Deployment Checklist

Use this checklist before deploying to production.

## Security

- [ ] Changed `ADMIN_PASSWORD` from default value
- [ ] Using a strong password (12+ characters, mixed case, numbers, symbols)
- [ ] Added all environment variables to hosting platform
- [ ] Verified Supabase Row Level Security (RLS) settings
- [ ] Tested Basic Auth login on staging/preview

## Content

- [ ] Updated phone number in `components/Footer.tsx`
- [ ] Updated WhatsApp number in `components/Footer.tsx`
- [ ] Customized case studies in `data/case-studies.json`
- [ ] Reviewed and customized package descriptions
- [ ] Updated company name throughout the site
- [ ] Checked all page titles and meta descriptions

## Testing

- [ ] Tested lead form submission
- [ ] Verified leads appear in admin dashboard
- [ ] Tested all lead statuses (new, contacted, qualified, etc.)
- [ ] Verified lead scoring works correctly
- [ ] Tested admin login
- [ ] Checked all internal links work
- [ ] Tested on mobile devices
- [ ] Verified responsive design on all pages

## Supabase

- [ ] Created `leads` table with correct schema
- [ ] Added indexes for performance
- [ ] Configured appropriate RLS policies (or disabled if not needed)
- [ ] Verified connection from production environment
- [ ] Set up backup strategy (if needed)

## Analytics & Tracking

- [ ] Integrated Google Tag Manager (if using)
- [ ] Set up event listeners for custom tracking events
- [ ] Verified `lead_submit` event fires
- [ ] Verified `phone_click` event fires
- [ ] Verified `whatsapp_click` event fires
- [ ] Connected to Google Analytics (if using)

## Performance

- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Tested page load speeds
- [ ] Optimized images (if added custom ones)

## Environment Variables

Production environment should have:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `ADMIN_USERNAME`
- [ ] `ADMIN_PASSWORD`

## Post-Deployment

- [ ] Test live site on production URL
- [ ] Submit a test lead
- [ ] Verify email is captured correctly
- [ ] Test admin dashboard access
- [ ] Set up monitoring/uptime checks (optional)
- [ ] Configure custom domain (if applicable)
- [ ] Set up SSL certificate (should be automatic on Vercel/Netlify)

## Optional Enhancements

- [ ] Add email notifications for new leads
- [ ] Set up automated email responses
- [ ] Add Google reCAPTCHA to prevent spam
- [ ] Implement rate limiting on form submissions
- [ ] Add honeypot field for spam prevention
- [ ] Set up A/B testing (if desired)

## Documentation

- [ ] Update README.md with production URL
- [ ] Document any customizations made
- [ ] Share admin credentials with team (securely)
- [ ] Create runbook for common tasks

---

## Quick Deploy Commands

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

✅ Once everything is checked, you're ready to launch!
