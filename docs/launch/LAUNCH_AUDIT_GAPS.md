# Lumora Launch Audit - Gaps and Blockers

This document lists the gaps that prevent Lumora from being market release ready. Each item includes evidence based on the current repo state.

Scope reviewed:

- UI routes: `src/app`
- Application logic: `src/application`
- Infrastructure: `src/infrastructure`
- Domain model: `src/core`
- Data model: `prisma/schema.prisma`
- Docs: `docs`

## Blockers (must be done before any public launch)

1. Missing pricing, features, about, and legal marketing pages.

- Evidence: marketing routes are allowed but no pages exist: `src/infrastructure/auth/middleware.ts`.
- Evidence: only `src/app/page.tsx` exists for marketing; no `/pricing`, `/features`, `/about` routes.
- Impact: users cannot learn value or choose a tier.

2. No signup or tenant provisioning flow.

- Evidence: only login exists: `src/app/(auth)/login/page.tsx`.
- Evidence: only credentials auth provider; no user creation or tenant creation: `src/infrastructure/auth/auth.config.ts`.
- Impact: no self-serve onboarding, no studio creation, no free trial start.

3. No subscription billing or free trial implementation.

- Evidence: subscription model exists in schema but no app logic: `prisma/schema.prisma`.
- Evidence: Stripe integration only for one-time order payments: `src/infrastructure/payments/stripe-client.ts`.
- Evidence: no subscription webhooks: `src/app/api/webhooks/stripe/route.ts`.
- Impact: cannot sell SaaS plans or enforce tier changes.

4. Broken billing upgrade path.

- Evidence: UI links to `/dashboard/settings/billing`, but route does not exist: `src/app/(dashboard)`.
- Impact: users cannot upgrade/downgrade plans, add payment method, or manage invoices.

5. Core gallery management is incomplete.

- Evidence: list and create only; edit and publish flows are missing; edit links are dead: `src/shared/ui/gallery-table.tsx`, `src/app/(dashboard)/dashboard/galleries/page.tsx`.
- Evidence: no gallery detail page, no publish/archive, no access code management.
- Impact: studios cannot actually deliver galleries.

6. Photo upload and management is missing end-to-end.

- Evidence: processing exists but no upload endpoint or UI: `src/application/gallery/commands/upload-photo.ts`, `src/infrastructure/storage/image-service.ts`.
- Impact: studios cannot upload or organize photos.

7. Client ordering flow is missing.

- Evidence: gallery UI has a "NARUCI" button with no action: `src/app/(gallery)/[tenant]/gallery/page.tsx`.
- Evidence: no order creation UI, no cart, no success/cancel pages for checkout: `src/app/api/checkout/route.ts`.
- Impact: no revenue path for print orders.

## Major Gaps (needed for a viable MVP)

8. Product catalog CRUD is incomplete.

- Evidence: list exists; create/edit pages are missing: `src/app/(dashboard)/dashboard/products/page.tsx`.
- Evidence: API has POST/GET only; no update/delete: `src/app/api/dashboard/products/route.ts`.

9. Orders management UI is missing.

- Evidence: navigation points to `/dashboard/orders` but no route exists: `src/shared/ui/dashboard-nav.tsx`.
- Impact: studios cannot track, fulfill, or refund orders.

10. Access control rules exist but are not enforced consistently.

- Evidence: role fields exist but no RBAC checks in routes or API: `prisma/schema.prisma`, `src/infrastructure/auth/auth.config.ts`.

11. Gallery access code logic is not implemented.

- Evidence: `GalleryAccessCode` exists in schema but no API or UI uses it.
- Impact: "code-protected" galleries are not actually enforced beyond the gallery code itself.

12. Favorites are UI-only.

- Evidence: UI toggles exist but no persistence or endpoints: `src/shared/ui/photo-grid.tsx`, `src/shared/ui/lightbox.tsx`.

13. White label and custom domain are not implemented.

- Evidence: fields exist in schema but no UI or setup flows: `prisma/schema.prisma`.

14. Onboarding and studio setup are missing.

- Evidence: no setup wizard or profile settings (logo, brand color, contact info).

15. API documentation is not served in app.

- Evidence: link points to `/docs/api` but route does not exist: `src/app/(dashboard)/dashboard/settings/api/page.tsx`.

16. Email flows are not implemented.

- Evidence: email infrastructure is placeholder: `src/infrastructure/email/.gitkeep`.
- Impact: no verification emails, order confirmations, or password resets.

17. Password reset and email verification are missing.

- Evidence: only credentials login; no flows for account recovery: `src/infrastructure/auth/auth.config.ts`.

18. Storage usage limits are not enforced.

- Evidence: `StorageUsage` model exists, but no enforcement or update logic in app.

19. Marketing metadata is default.

- Evidence: `src/app/layout.tsx` uses "Create Next App" metadata.

20. Demo experience is missing.

- Evidence: "View Demo" on the homepage routes to `/login`: `src/app/page.tsx`.

## Minor Gaps (should be resolved for a polished launch)

21. Localization is inconsistent.

- Evidence: marketing copy is English while app UI is Croatian/Serbian.
- Impact: inconsistent user experience.

22. Legal pages are missing.

- Evidence: no `/terms`, `/privacy`, or `/dpa` routes.

23. Rate limiting and abuse protections are missing for public APIs.

- Evidence: no rate limiting middleware or config in API routes.

24. Audit logs exist in schema but are unused.

- Evidence: `AuditLog` model has no usage in routes.

25. Monitoring and error reporting are not configured.

- Evidence: no Sentry or similar integration in `src`.

26. Stripe API version is set to a future value; risk of failure.

- Evidence: `src/infrastructure/payments/stripe-client.ts` uses `2025-12-15.clover`.

## Open Decisions Needed Before Implementation

- Pricing tiers, limits, and trial length.
- Which features are included per tier (beyond `src/shared/lib/features.ts`).
- Supported currencies, tax rules, and invoice requirements.
- Fulfillment workflow (manual vs integrated print lab).
- Branding and localization strategy.
