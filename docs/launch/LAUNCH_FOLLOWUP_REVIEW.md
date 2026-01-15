# Lumora Launch Follow-Up Review

Date: 2026-01-15
Commit reviewed: e281ce1
Environment checked: https://lumora.genai.hr

This follow-up captures the blocking items found after the "MVP critical path complete" claim. Each item includes required fixes and proof for acceptance.

## Critical

1. Signup -> Login is broken on main domain

- Issue: `/signup` redirects to `/login`, but `/login` redirects to `/` in production without a tenant.
- Impact: New users cannot log in after signup.
- Evidence: `src/shared/ui/signup-form.tsx`, `src/app/(auth)/login/page.tsx`.
- Required fix:
  - Redirect to tenant login (e.g., `https://{slug}.lumora.genai.hr/login`) on successful signup, or
  - Allow `/login` on main domain with tenant selection.
- Proof of fix:
  - Screen recording of signup -> login -> dashboard on production.
  - Server logs showing tenant resolution with correct host.

2. Stripe API version not fixed

- Issue: Stripe client still uses a future API version.
- Impact: Stripe SDK or API calls may fail in production.
- Evidence: `src/infrastructure/payments/stripe-client.ts`.
- Required fix:
  - Set a supported Stripe API version and lock it in config.
- Proof of fix:
  - Code diff and successful Stripe call in logs.

## High

3. Gallery edit is unreachable from UI

- Issue: Gallery list links to `/dashboard/galleries/{id}` but edit page is `/dashboard/galleries/{id}/edit`.
- Impact: Users cannot reach edit/publish flow.
- Evidence: `src/shared/ui/gallery-table.tsx`, `src/app/(dashboard)/dashboard/galleries/[id]/edit/page.tsx`.
- Required fix:
  - Update link or add route alias.
- Proof of fix:
  - Screenshot of gallery list linking to edit page and successful edit/publish.

4. Orders status management UI missing

- Issue: List links to `/dashboard/orders/{id}`, but no details page exists.
- Impact: “status management” claim is not true in the UI.
- Evidence: `src/shared/ui/orders-table.tsx`.
- Required fix:
  - Implement order details page with status update form, or
  - Remove link if not yet supported.
- Proof of fix:
  - UI screenshot and API update call from the page.

5. Tier selection bypasses billing/trial

- Issue: Signup accepts tier from query/body and writes it directly to tenant.
- Impact: Users can self-upgrade to Pro/Studio without payment or trial enforcement.
- Evidence: `src/shared/ui/signup-form.tsx`, `src/app/api/auth/signup/route.ts`.
- Required fix:
  - Force new tenants to Starter until subscription is created, or
  - Create a trial subscription and track status before setting tier.
- Proof of fix:
  - DB record showing trial status and tier changes tied to subscription.

## Medium

6. Slug generation edge cases

- Issue: Generated slug can be empty or too long when timestamp suffix is appended.
- Impact: Signup can fail or create invalid subdomains.
- Evidence: `src/app/api/auth/signup/route.ts`.
- Required fix:
  - Enforce non-empty slug with fallback,
  - Trim to 63 chars after suffixing.
- Proof of fix:
  - Unit tests and successful signup with edge-case studio names.

## Low

7. Legal copy not aligned with actual implementation

- Issue: Terms and privacy claims do not match current product state.
- Impact: Legal exposure if statements are inaccurate.
- Evidence: `src/app/(marketing)/terms/page.tsx`, `src/app/(marketing)/privacy/page.tsx`.
- Required fix:
  - Align copy with actual capabilities or implement missing guarantees.
- Proof of fix:
  - Updated legal docs and sign-off from legal.

## Verification Checklist (Follow-Up)

- [ ] Signup flow works end-to-end on production (main domain -> tenant login -> dashboard).
- [ ] Stripe API version updated to supported value and verified via live test call.
- [ ] Gallery edit page reachable from gallery list and publish works.
- [ ] Orders details page exists and status update works from UI.
- [ ] Tier selection no longer bypasses billing/trial logic.
- [ ] Slug generation handles edge cases (empty, long, reserved).
- [ ] Legal pages updated or confirmed by legal owner.
