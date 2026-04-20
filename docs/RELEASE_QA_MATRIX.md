# ZCE Release QA Matrix

## Scope

Use this checklist for a final manual preflight before public rollout.

## Test Environments

- iPhone (latest iOS), production build
- iPhone (previous iOS major), production build
- Android (current), production build
- Web landing on Safari iOS, Chrome iOS, Chrome Android, desktop Chrome

## 1. Auth And Account

- [ ] Sign up with new email and username.
- [ ] Sign in with email and password.
- [ ] Sign in with username and password.
- [ ] Wrong password shows friendly error.
- [ ] Password reset email sends successfully.
- [ ] Sign out returns to unauthenticated state.

## 2. Archives, Verify Reps, And Media

- [ ] Historical verify entries still appear after app restart.
- [ ] Verify entries with photo proof render image preview.
- [ ] Verify entries with voice proof show playback controls.
- [ ] Audio proof plays and stops cleanly.
- [ ] Closing detail view returns to previous archive scroll position.
- [ ] Marker text placeholders do not appear as fake proof content.

## 3. Share Protocol And QR

- [ ] Share modal opens in harvest, challenge, and invite modes.
- [ ] Generated card includes real scannable QR.
- [ ] QR resolves to the expected share URL.
- [ ] Image share works when native share modules are available.
- [ ] Text fallback share works when image sharing is unavailable.

## 4. Landing Deep Link Behavior

- [ ] "Open App" on mobile attempts deep link first.
- [ ] If app not installed, fallback opens App Store URL.
- [ ] "Open App" on desktop routes to App Store page.
- [ ] /share path triggers app-open flow correctly.
- [ ] No invalid URL errors in browser console.

## 5. Subscription And Billing

- [ ] RevenueCat initializes without errors.
- [ ] Monthly purchase flow completes.
- [ ] Yearly purchase flow completes.
- [ ] Restore purchases syncs entitlement correctly.
- [ ] Manage subscription opens device subscription settings.
- [ ] Premium state updates UI (tier, access, limits) after purchase/restore.

## 6. AI Reliability

- [ ] Main chat returns response under normal network.
- [ ] Drill feedback returns structured output.
- [ ] Home signal quote/roast loads without provider error leakage.
- [ ] Proxy outage path returns safe fallback copy.

## 7. Regression Smoke

- [ ] Home screen loads without crashes.
- [ ] Profile screen loads without crashes.
- [ ] Drills tab starts and completes at least one drill.
- [ ] Nightly Harvest header text does not overflow on small screens.

## Sign-Off

- Build version:
- Date:
- Tester:
- Result: PASS / FAIL
- Blocking issues:
