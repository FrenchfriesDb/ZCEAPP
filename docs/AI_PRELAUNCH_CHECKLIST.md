# ZCE AI Pre-Launch Checklist

Use this checklist before TestFlight scale-up or public marketing.

## 1) Environment + Secrets
- [ ] `EXPO_PUBLIC_AI_PROXY_URL` points to production proxy URL (not localhost).
- [ ] Client app has no provider secrets embedded (`aiProviders: {}` in app config).
- [ ] Proxy secrets live only on server/`.env.proxy` and are rotated if previously exposed.
- [ ] RevenueCat API keys and product IDs match App Store Connect exactly.

## 2) AI Reliability Gates
- [ ] AI success rate >= 95% over at least 200 chat requests.
- [ ] Proxy `/metrics` shows fallback working across providers (no single point of failure).
- [ ] No persistent `Proxy generation failed` loops.
- [ ] No repeated `API Key not set` warnings in runtime logs.

## 3) AI Latency Gates
- [ ] p50 latency <= 2.5s (chat).
- [ ] p95 latency <= 5.0s (chat).
- [ ] p99 latency <= 8.0s (chat).
- [ ] Home-signal generation usually <= 2.0s.

## 4) Response Quality Gates
- [ ] Name addressing uses live user name (`[Name]-la`) and never hardcoded aliases.
- [ ] Classic mode includes required sections:
  - [ ] `BRUTAL TRUTH:`
  - [ ] `ONE NON-NEGOTIABLE DRILL:`
  - [ ] `ONE ZANE QUOTE TO EMBODY:`
- [ ] No markdown leakage (`**bold**`, `## headers`) in final user-visible output.
- [ ] Style toggles (`classic`, `coach`, `nervous`) reliably change tone and structure.

## 5) Payments + Entitlements
- [ ] Sandbox purchase succeeds with Sandbox tester account on physical device.
- [ ] Restore purchases works and updates entitlement state.
- [ ] `isPremium` state updates app UI/limits immediately after purchase/restore.
- [ ] Subscription screen shows clear errors for store permission issues.

## 6) Operational Readiness
- [ ] Proxy `/health` endpoint is monitored.
- [ ] Proxy `/metrics` endpoint reviewed daily during beta.
- [ ] Provider balances funded (Groq/OpenRouter/Gemini/etc.).
- [ ] Alerting in place for >5% failures in rolling 15-minute windows.

## 7) Share Links (Universal Link Plan)
- [ ] Temporary fallback uses App Store URL via `EXPO_PUBLIC_SHARE_URL`.
- [ ] Choose a custom domain (e.g., `zceapp.com`) for universal links.
- [ ] Host `/.well-known/apple-app-site-association` on that domain with correct Team ID + bundle ID.
- [ ] Add `applinks:<domain>` to iOS Associated Domains when domain is ready.
- [ ] Landing page redirects to App Store if app is not installed.

## 8) Manual Smoke Test (Required)
- [ ] Open app cold start, send first chat message, receive response.
- [ ] Send 10 rapid chat messages; no hard lock, no permanent offline state.
- [ ] Force one provider failure (e.g., temporary key removal) and verify fallback.
- [ ] Run onboarding -> paywall -> create identity -> login path end-to-end.

## Useful Commands
```bash
# Start local proxy
npm run ai:proxy

# Check proxy health
curl -sS http://127.0.0.1:8787/health

# Inspect live proxy metrics
curl -sS http://127.0.0.1:8787/metrics

# Restart app cache
npx expo start -c
```
