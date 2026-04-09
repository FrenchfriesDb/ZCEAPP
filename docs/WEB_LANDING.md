# ZCE Landing Page (Free Hosting)

This repo includes a lightweight landing page in `landing/` for Vercel or Netlify.

## Deploy on Vercel (Free)
1. Create a new project in Vercel.
2. Select the GitHub repo.
3. Set **Root Directory** to `landing`.
4. Framework preset: `Other`.
5. Deploy.

Resulting URL example: `https://zce-landing.vercel.app`

## Use as temporary share fallback
Set this in `.env` or `app.config.js`:
```
EXPO_PUBLIC_SHARE_URL=https://zce-landing.vercel.app
```

## App Store fallback (no domain yet)
If you do not have a domain, use the App Store link:
```
EXPO_PUBLIC_SHARE_URL=https://apps.apple.com/app/id6759347826
```

## Universal Links later (requires a domain you control)
1. Buy a domain (even a cheap one works).
2. Host `/.well-known/apple-app-site-association` on that domain.
3. Add `applinks:<domain>` to iOS Associated Domains.

Until then, the landing page uses a simple scheme-open + App Store fallback.
