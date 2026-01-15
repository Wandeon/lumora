# Lumora Launch MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all 26 launch gaps identified in LAUNCH_AUDIT_GAPS.md to make Lumora market-ready.

**Architecture:** Incremental feature completion using existing Next.js 16 + Prisma stack. No new dependencies unless essential.

**Tech Stack:** Next.js 16, NextAuth v5, Prisma 6, Stripe, Cloudflare R2, Resend

---

## Implementation Phases

### Phase A: Quick Fixes (30 minutes)

Technical fixes that unblock everything else.

**Tasks:**

1. Fix app metadata - change "Create Next App" to "Lumora" with proper SEO
2. Fix Stripe API version - remove future date that will break
3. Fix localization - standardize on English for marketing, keep Croatian for app UI

### Phase B: Marketing Foundation (1 hour)

Landing pages that explain value proposition.

**Tasks:** 4. Create `/pricing` page with 3 tiers (Starter €0, Pro €29/mo, Studio €79/mo) 5. Create `/features` page highlighting key capabilities 6. Create `/about` page with company/product info 7. Create `/terms` and `/privacy` placeholder pages 8. Update landing page with proper CTAs to pricing/signup

### Phase C: Signup & Onboarding (2 hours)

Self-serve tenant creation flow.

**Tasks:** 9. Create `/signup` page with registration form 10. Create signup API endpoint that creates tenant + owner user 11. Add email verification flow using Resend 12. Add password reset flow 13. Create onboarding wizard (studio name, slug, logo upload, brand color) 14. Start 14-day trial on signup (default tier: Starter)

### Phase D: Gallery Management Completion (2 hours)

Full CRUD for galleries.

**Tasks:** 15. Create gallery edit page (`/dashboard/galleries/[id]/edit`) 16. Add publish/unpublish/archive actions 17. Add access code management UI 18. Enforce access codes on gallery view 19. Add gallery expiration handling

### Phase E: Photo Upload Pipeline (2 hours)

End-to-end photo management.

**Tasks:** 20. Create photo upload UI with drag-and-drop 21. Create signed upload endpoint for R2 22. Implement image processing (resize, thumbnail generation) 23. Add photo sorting and deletion 24. Add cover photo selection 25. Track storage usage per tenant

### Phase F: Products & Orders (2 hours)

Commerce flow completion.

**Tasks:** 26. Complete product CRUD (create, edit, delete pages) 27. Create orders dashboard page 28. Add order status management 29. Create client cart/selection flow 30. Add checkout success/cancel pages 31. Send order confirmation emails

### Phase G: Billing & Subscriptions (2 hours)

SaaS billing with Stripe.

**Tasks:** 32. Create billing settings page (`/dashboard/settings/billing`) 33. Create Stripe subscription checkout flow 34. Add subscription webhooks (create, update, cancel, invoice.paid) 35. Implement feature gating by tier 36. Add plan upgrade/downgrade UI

### Phase H: Polish & Hardening (1 hour)

Production readiness.

**Tasks:** 37. Add rate limiting to public APIs 38. Enable audit logging for critical actions 39. Add favorites persistence 40. Create demo gallery for marketing

---

## Default Configuration Decisions

These defaults can be changed later via environment variables or admin UI:

| Setting            | Default   | Rationale                   |
| ------------------ | --------- | --------------------------- |
| Trial length       | 14 days   | Industry standard           |
| Starter tier price | €0/month  | Free tier for adoption      |
| Pro tier price     | €29/month | Competitive with market     |
| Studio tier price  | €79/month | Premium features            |
| Starter storage    | 1 GB      | Enough for small portfolios |
| Pro storage        | 25 GB     | Suitable for active studios |
| Studio storage     | 100 GB    | Enterprise-level            |
| Starter galleries  | 3         | Limitation drives upgrade   |
| Pro galleries      | Unlimited | Core value prop             |
| Studio galleries   | Unlimited | Core value prop             |

---

## File Structure for New Routes

```
src/app/
├── (marketing)/
│   ├── pricing/page.tsx
│   ├── features/page.tsx
│   ├── about/page.tsx
│   ├── terms/page.tsx
│   └── privacy/page.tsx
├── (auth)/
│   ├── signup/page.tsx
│   ├── verify-email/page.tsx
│   └── reset-password/page.tsx
├── (dashboard)/dashboard/
│   ├── galleries/[id]/
│   │   └── edit/page.tsx
│   ├── products/
│   │   ├── new/page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── orders/page.tsx
│   └── settings/
│       └── billing/page.tsx
└── (gallery)/[tenant]/
    └── checkout/
        ├── success/page.tsx
        └── cancel/page.tsx
```

---

## API Endpoints to Add

| Method | Path                                         | Purpose                |
| ------ | -------------------------------------------- | ---------------------- |
| POST   | `/api/auth/signup`                           | Create tenant + user   |
| POST   | `/api/auth/verify-email`                     | Verify email token     |
| POST   | `/api/auth/reset-password`                   | Request password reset |
| POST   | `/api/auth/reset-password/confirm`           | Set new password       |
| PUT    | `/api/dashboard/galleries/[id]`              | Update gallery         |
| POST   | `/api/dashboard/galleries/[id]/publish`      | Publish gallery        |
| POST   | `/api/dashboard/galleries/[id]/access-codes` | Create access code     |
| POST   | `/api/photos/upload`                         | Get signed upload URL  |
| POST   | `/api/photos/process`                        | Process uploaded photo |
| PUT    | `/api/dashboard/products/[id]`               | Update product         |
| DELETE | `/api/dashboard/products/[id]`               | Delete product         |
| GET    | `/api/dashboard/orders`                      | List orders            |
| PUT    | `/api/dashboard/orders/[id]`                 | Update order status    |
| POST   | `/api/subscriptions/checkout`                | Start subscription     |
| POST   | `/api/subscriptions/portal`                  | Stripe billing portal  |
| POST   | `/api/webhooks/stripe/subscriptions`         | Subscription webhooks  |

---

## Testing Strategy

- Unit tests for new domain logic (signup validation, tier limits)
- Integration tests for Stripe webhook handling
- E2E tests for critical flows: signup → publish gallery → order

---

## Risk Mitigation

| Risk                              | Mitigation                                  |
| --------------------------------- | ------------------------------------------- |
| R2 credentials not configured     | Graceful fallback with local storage in dev |
| Stripe credentials not configured | Skip billing features, show "Coming Soon"   |
| Resend not configured             | Log emails to console in dev                |

---

## Success Criteria

1. New user can sign up, verify email, and access dashboard
2. Studio can create gallery, upload photos, and publish
3. Client can view gallery, select photos, and complete order
4. Stripe subscription flow works end-to-end
5. All verification checklist items pass

---

## Execution Order

Phases should be executed sequentially (A → H) as each builds on prior work.

Estimated total implementation time: ~12 hours with focused subagent execution.
