# Market Readiness Audit Matrix (Lumora)

**Audit Date:** 2026-01-16
**Product:** Lumora - Photo Gallery & Print Ordering SaaS
**Target Market:** Boutique Wedding Photographers (Croatia/EU)

Purpose: Surface operational gaps beyond feature coverage. Use this alongside
`docs/client-persona-checklist.md`.

---

## Scoring Legend

- Score each item 0-3:
  - 0 = missing / blocked
  - 1 = partial / brittle
  - 2 = functional / needs polish
  - 3 = strong / reliable
- Risk = Impact (1-3) x Likelihood (1-3)
- Go/No-Go: any Critical (Risk >= 6) unresolved = **No-Go**

---

## Critical-Path Journeys (Gate Pass/Fail)

### J1: Signup -> First Gallery Live

```
[Signup] → [Create Gallery] → [Upload Photos] → [Publish] → [Share Link]
```

| Step           | Status   | Score | Notes                                    |
| -------------- | -------- | ----- | ---------------------------------------- |
| Signup         | PASS     | 3     | Transactional tenant+user, welcome email |
| Create Gallery | PASS     | 3     | Auto code generation, CRUD complete      |
| Upload Photos  | **FAIL** | 0     | No upload endpoint or UI                 |
| Publish        | PASS     | 3     | One-click publish works                  |
| Share Link     | PASS     | 3     | Code displayed, URL pattern clear        |

- **Gate:** < 30 minutes end-to-end
- **Status:** **BLOCKED** - Photo upload missing
- **Evidence:** `src/application/gallery/commands/upload-photo.ts` exists but no API route
- **Owner:** Dev Team
- **Follow-up:**
  - [ ] Create `POST /api/dashboard/galleries/[id]/photos` endpoint
  - [ ] Build drag-drop upload UI component
  - [ ] Test bulk upload performance

---

### J2: Client Access -> Favorites -> Order

```
[Open Link] → [Enter Code] → [View Photos] → [Favorite] → [Add to Cart] → [Checkout]
```

| Step        | Status   | Score | Notes                                   |
| ----------- | -------- | ----- | --------------------------------------- |
| Open Link   | PASS     | 3     | Tenant landing page works               |
| Enter Code  | PASS     | 3     | Code validation, redirect to gallery    |
| View Photos | PASS     | 3     | Responsive grid, lightbox, lazy loading |
| Favorite    | **FAIL** | 0     | UI exists, API endpoints missing        |
| Add to Cart | **FAIL** | 0     | No cart UI component                    |
| Checkout    | PARTIAL  | 2     | Works if order exists via API           |

- **Gate:** No errors, clear success confirmation
- **Status:** **BLOCKED** - Favorites API + Cart UI missing
- **Evidence:**
  - `prisma/schema.prisma:207-222` - Favorite model exists
  - `src/shared/ui/photo-grid.tsx` - Heart icons display but no functionality
- **Owner:** Dev Team
- **Follow-up:**
  - [ ] Create `POST/DELETE /api/galleries/[code]/favorites` endpoints
  - [ ] Build shopping cart component
  - [ ] Add product selection to lightbox

---

### J3: Payment -> Order Confirmation -> Studio Notification

```
[Pay] → [Stripe Webhook] → [Order Confirmed] → [Email Sent] → [Dashboard Updated]
```

| Step                | Status  | Score | Notes                               |
| ------------------- | ------- | ----- | ----------------------------------- |
| Payment             | PASS    | 3     | Stripe checkout works               |
| Webhook Processing  | PASS    | 3     | Signature verification, idempotency |
| Order Confirmed     | PASS    | 3     | Status updated, paidAt set          |
| Customer Email      | PASS    | 2     | Confirmation email sent             |
| Studio Notification | PARTIAL | 1     | No studio email on new orders       |
| Dashboard Update    | PASS    | 3     | Real-time in order list             |

- **Gate:** Within 5 minutes
- **Status:** PASS (with gaps)
- **Evidence:**
  - `src/app/api/webhooks/stripe/route.ts` - webhook handler
  - `src/infrastructure/email/templates/order-confirmation.ts` - customer email
- **Owner:** Dev Team
- **Follow-up:**
  - [ ] Add studio notification email on new orders
  - [ ] Add email on manual status changes (processing, shipped, etc.)

---

### J4: Refund/Cancel Flow

```
[Cancel Request] → [Stripe Refund] → [Order Updated] → [Customer Notified]
```

| Step              | Status   | Score | Notes                             |
| ----------------- | -------- | ----- | --------------------------------- |
| Cancel Order      | PARTIAL  | 1     | Manual status update only         |
| Stripe Refund     | **FAIL** | 0     | No refund API or webhook          |
| Order Updated     | PARTIAL  | 1     | Status can be set, no audit trail |
| Customer Notified | **FAIL** | 0     | No email on cancellation          |

- **Gate:** Completed without manual DB edits
- **Status:** **FAIL** - No refund workflow
- **Evidence:**
  - `src/app/api/webhooks/stripe/route.ts` - only handles `checkout.session.completed`
  - Missing: `charge.refunded` webhook handler
- **Owner:** Dev Team
- **Follow-up:**
  - [ ] Add `charge.refunded` webhook handler
  - [ ] Create refund initiation API
  - [ ] Add cancellation email template

---

## Operational Readiness

### O1: Monitoring and Alerts

| Check               | Score | Evidence                               |
| ------------------- | ----- | -------------------------------------- |
| Health endpoint     | 3     | `/api/health` - DB, Redis, SMTP status |
| Error tracking      | 1     | Sentry installed, DSN not configured   |
| Uptime monitoring   | 0     | None                                   |
| Performance metrics | 0     | None                                   |
| Business metrics    | 1     | Dashboard KPIs only (no trends)        |
| Alert channels      | 0     | No Slack/email alerts                  |

- **Status:** PARTIAL (Score: 5/18 = 28%)
- **Evidence:** `src/app/api/health/route.ts`, `@sentry/nextjs` in package.json
- **Owner:** Ops/Dev
- **Follow-up:**
  - [ ] Configure Sentry DSN in production
  - [ ] Set up UptimeRobot/Pingdom for `/api/health`
  - [ ] Add email alerts on health check failure
  - [ ] Consider PostHog for business analytics

---

### O2: Incident Response

| Check               | Score | Evidence                    |
| ------------------- | ----- | --------------------------- |
| Runbook             | 0     | None                        |
| On-call rotation    | 0     | Single-person operation     |
| Rollback procedure  | 1     | Docker Compose restart only |
| Status page         | 0     | None                        |
| Post-mortem process | 0     | None                        |

- **Status:** NOT READY (Score: 1/15 = 7%)
- **Evidence:** No incident response documentation found
- **Owner:** Ops
- **Follow-up:**
  - [ ] Create basic runbook (restart, common issues)
  - [ ] Document rollback procedure
  - [ ] Consider Statuspage.io for public status

---

### O3: Backups and Data Retention

| Check                  | Score | Evidence              |
| ---------------------- | ----- | --------------------- |
| Database backups       | 0     | Docker volume only    |
| Point-in-time recovery | 0     | Not implemented       |
| Photo storage          | 2     | R2 durability (11 9s) |
| Backup testing         | 0     | Never tested          |
| Retention policy       | 0     | Undefined             |
| RTO/RPO defined        | 0     | Not defined           |

- **Status:** CRITICAL GAP (Score: 2/18 = 11%)
- **Evidence:** `docker-compose.yml` - postgres-data volume, no backup script
- **Owner:** Ops
- **Follow-up:**
  - [ ] Implement daily pg_dump cron job
  - [ ] Upload backups to R2 or external storage
  - [ ] Define RTO/RPO (suggest: RTO 4h, RPO 24h)
  - [ ] Test restore procedure

---

### O4: Support Workflow

| Check           | Score | Evidence                 |
| --------------- | ----- | ------------------------ |
| Contact method  | 0     | No support email visible |
| FAQ/Help        | 0     | No documentation         |
| Ticket system   | 0     | None                     |
| Response SLA    | 0     | Undefined                |
| Escalation path | 0     | None                     |

- **Status:** NOT IMPLEMENTED (Score: 0/15 = 0%)
- **Evidence:** No support infrastructure in codebase
- **Owner:** Product
- **Follow-up:**
  - [ ] Add support email to footer and pricing page
  - [ ] Create FAQ page (10-15 common questions)
  - [ ] Define email response SLA (suggest: 24h business hours)
  - [ ] Consider Freshdesk free tier

---

### O5: Compliance Basics

| Check            | Score | Evidence                         |
| ---------------- | ----- | -------------------------------- |
| Privacy policy   | 2     | `/privacy` page exists           |
| Terms of service | 2     | `/terms` page exists             |
| Cookie consent   | 0     | Not implemented                  |
| GDPR data export | 0     | Not implemented                  |
| Data deletion    | 0     | Not implemented                  |
| Access logging   | 1     | AuditLog model exists, not wired |

- **Status:** PARTIAL (Score: 5/18 = 28%)
- **Evidence:** `src/app/(marketing)/privacy/page.tsx`, `src/app/(marketing)/terms/page.tsx`
- **Owner:** Legal/Dev
- **Follow-up:**
  - [ ] Add cookie consent banner
  - [ ] Implement data export endpoint
  - [ ] Wire AuditLog to auth events
  - [ ] Review privacy policy for GDPR completeness

---

## Product Reliability

### R1: Error Handling UX

| Check                 | Score | Evidence                         |
| --------------------- | ----- | -------------------------------- |
| Form validation       | 2     | Zod schemas, inline errors       |
| API error messages    | 2     | Consistent pattern, some generic |
| Global error boundary | 0     | No error.tsx files               |
| Loading states        | 2     | Button states, Suspense partial  |
| Recovery suggestions  | 1     | "Try again" only                 |

- **Status:** FUNCTIONAL (Score: 7/15 = 47%)
- **Evidence:** Error handling patterns in form components
- **Owner:** Dev
- **Follow-up:**
  - [ ] Add `error.tsx` files for global error boundaries
  - [ ] Improve error messages with specific recovery actions
  - [ ] Standardize language (currently mixed Serbian/English)

---

### R2: Performance (Gallery Load)

| Check               | Score | Evidence                                  |
| ------------------- | ----- | ----------------------------------------- |
| Image optimization  | 3     | 3 variants (original, 2048px, 800px WebP) |
| Lazy loading        | 3     | Next.js Image component                   |
| Responsive sizing   | 3     | Proper `sizes` attribute                  |
| CDN caching         | 1     | R2 serves images, no cache headers        |
| Bundle optimization | 2     | Turbopack, code splitting                 |

- **Target:** < 2s LCP on mobile
- **Status:** GOOD (Score: 12/15 = 80%)
- **Evidence:** `src/infrastructure/storage/image-service.ts`
- **Owner:** Dev
- **Follow-up:**
  - [ ] Add CDN caching headers
  - [ ] Measure actual LCP in production
  - [ ] Consider image preloading for lightbox

---

### R3: Payment Reliability

| Check                  | Score | Evidence                                   |
| ---------------------- | ----- | ------------------------------------------ |
| Checkout success rate  | 3     | Stripe integration solid                   |
| Signature verification | 3     | Proper webhook validation                  |
| Idempotency            | 3     | Duplicate prevention via providerPaymentId |
| Amount validation      | 3     | Checks session.amount_total vs order.total |
| Failure handling       | 0     | No payment_intent.payment_failed handler   |
| Retry mechanism        | 0     | None for failed payments                   |

- **Target:** > 99% checkout success
- **Status:** GOOD (core), GAP (failures) (Score: 12/18 = 67%)
- **Evidence:** `src/app/api/webhooks/stripe/route.ts`
- **Owner:** Dev
- **Follow-up:**
  - [ ] Add payment failure webhook handler
  - [ ] Consider order recovery emails for abandoned carts

---

## Commercial Readiness

### C1: Pricing Clarity

| Check             | Score | Evidence                             |
| ----------------- | ----- | ------------------------------------ |
| Tier comparison   | 3     | Clear pricing page with 3 tiers      |
| Feature breakdown | 2     | Listed but some features not working |
| Upgrade path      | 1     | Mentioned but no upgrade flow        |
| Trial period      | 2     | "14-day free trial" advertised       |
| Billing portal    | 0     | Not implemented                      |

- **Status:** PARTIAL (Score: 8/15 = 53%)
- **Evidence:** `src/app/(marketing)/pricing/page.tsx`
- **Owner:** Product/Dev
- **Follow-up:**
  - [ ] Remove/mark non-functional features (coupons, multi-user, analytics)
  - [ ] Implement tier upgrade flow
  - [ ] Add Stripe billing portal integration

---

### C2: Onboarding Time-to-Value

| Check                 | Score | Evidence                          |
| --------------------- | ----- | --------------------------------- |
| Signup time           | 3     | < 2 minutes                       |
| First gallery         | 2     | Quick if photos could be uploaded |
| First client delivery | 0     | Blocked by upload                 |
| Guided setup          | 0     | No wizard/checklist               |
| Documentation         | 0     | None                              |

- **Target:** First client delivery < 24h
- **Status:** BLOCKED (Score: 5/15 = 33%)
- **Evidence:** Photo upload missing blocks entire flow
- **Owner:** Product/Dev
- **Follow-up:**
  - [ ] Implement photo upload (prerequisite)
  - [ ] Add onboarding checklist
  - [ ] Create getting started guide

---

### C3: Competitive Parity

**Top 3 Competitors:** Pic-Time, CloudSpot, Pixieset

| Feature         | Lumora   | Competitors | Gap           |
| --------------- | -------- | ----------- | ------------- |
| Gallery hosting | Partial  | Full        | Photo upload  |
| Client proofing | Partial  | Full        | Favorites API |
| Print ordering  | Partial  | Full        | Cart UI       |
| Mobile apps     | No       | Some        | Major gap     |
| Integrations    | API only | Many        | Minor gap     |
| Pricing         | Lower    | Higher      | Advantage     |

- **Status:** PARTIAL PARITY (blocked by core gaps)
- **Evidence:** Competitor research
- **Owner:** Product
- **Follow-up:**
  - [ ] Close core feature gaps first
  - [ ] Consider mobile web PWA
  - [ ] Document competitive advantages

---

## Risk Register

| ID    | Risk                             | Impact | Likelihood | Score          | Mitigation                | Owner   | ETA    |
| ----- | -------------------------------- | ------ | ---------- | -------------- | ------------------------- | ------- | ------ |
| R-001 | **Photo upload unavailable**     | 3      | 3          | **9 CRITICAL** | Implement upload API + UI | Dev     | Week 1 |
| R-002 | **Cart UI missing**              | 3      | 3          | **9 CRITICAL** | Build cart component      | Dev     | Week 1 |
| R-003 | **Favorites API missing**        | 2      | 3          | **6 HIGH**     | Create endpoints          | Dev     | Week 1 |
| R-004 | **No database backups**          | 3      | 2          | **6 HIGH**     | Implement pg_dump cron    | Ops     | Week 2 |
| R-005 | **Payment failure unhandled**    | 2      | 2          | **4 MEDIUM**   | Add failure webhook       | Dev     | Week 2 |
| R-006 | **No error tracking**            | 2      | 2          | **4 MEDIUM**   | Configure Sentry          | Dev     | Week 1 |
| R-007 | **No support channel**           | 2      | 3          | **6 HIGH**     | Add contact + FAQ         | Product | Week 2 |
| R-008 | **Dashboard not mobile**         | 1      | 3          | **3 LOW**      | Responsive redesign       | Dev     | Week 3 |
| R-009 | **Refund flow missing**          | 2      | 2          | **4 MEDIUM**   | Add refund webhook        | Dev     | Week 3 |
| R-010 | **Private gallery bypass**       | 2      | 1          | **2 LOW**      | Add visibility check      | Dev     | Week 2 |
| R-011 | **No 3D Secure (SCA)**           | 2      | 2          | **4 MEDIUM**   | Implement SCA             | Dev     | Week 4 |
| R-012 | **Coupon system non-functional** | 1      | 3          | **3 LOW**      | Implement or remove       | Dev     | Week 4 |

**Critical Risks (Score >= 6):** R-001, R-002, R-003, R-004, R-007

---

## Release Gates

### Gate 1: Internal Alpha

**Target:** Development team testing

| Criteria                    | Status | Notes                       |
| --------------------------- | ------ | --------------------------- |
| Core authentication working | PASS   | NextAuth functional         |
| Gallery CRUD functional     | PASS   | List, create, edit, publish |
| Order backend functional    | PASS   | Create, status, Stripe      |
| Photo upload (manual API)   | FAIL   | Not implemented             |
| Stripe test mode            | PASS   | Configured                  |

**Status:** **BLOCKED** (1 failing criteria)
**Action Required:** Implement photo upload

---

### Gate 2: Private Beta

**Target:** 5-10 friendly photographers

| Criteria                 | Status  | Notes                      |
| ------------------------ | ------- | -------------------------- |
| All Alpha criteria       | BLOCKED | See above                  |
| Photo upload UI complete | FAIL    | Not started                |
| Cart UI complete         | FAIL    | Not started                |
| Favorites functional     | FAIL    | API missing                |
| Basic error handling     | PASS    | Consistent patterns        |
| Health monitoring        | PARTIAL | Endpoint exists, no alerts |
| Support email published  | FAIL    | Not visible                |

**Status:** **NOT READY** (5 failing criteria)
**Estimated Effort:** 2-3 weeks after blockers resolved

---

### Gate 3: Public Beta

**Target:** Open signups, limited marketing

| Criteria                     | Status  | Notes                  |
| ---------------------------- | ------- | ---------------------- |
| All Beta criteria            | BLOCKED | See above              |
| Mobile dashboard             | FAIL    | Fixed sidebar          |
| Email notifications complete | PARTIAL | Manual updates missing |
| Payment failure handling     | FAIL    | No webhook             |
| Database backups automated   | FAIL    | Not implemented        |
| Sentry error tracking        | FAIL    | DSN not set            |
| FAQ/Help page                | FAIL    | Not created            |
| Terms of Service finalized   | PARTIAL | Exists, needs review   |

**Status:** **NOT READY** (6 failing criteria)
**Estimated Effort:** 4-6 weeks after Private Beta

---

### Gate 4: General Availability

**Target:** Full marketing, production SLA

| Criteria                 | Status  | Notes                  |
| ------------------------ | ------- | ---------------------- |
| All Public Beta criteria | BLOCKED | See above              |
| Coupon system functional | FAIL    | Schema only            |
| Multi-user invitations   | FAIL    | RBAC ready, no invites |
| Analytics dashboard      | FAIL    | Basic KPIs only        |
| 99.5% uptime target      | UNKNOWN | No monitoring          |
| Incident runbook         | FAIL    | Not created            |
| 30-day backup retention  | FAIL    | No backups             |
| Support SLA published    | FAIL    | Not defined            |

**Status:** **NOT READY** (8 failing criteria)
**Estimated Effort:** 6-8 weeks after Public Beta

---

## Summary Scores

| Category                 | Score   | Status      |
| ------------------------ | ------- | ----------- |
| J1: Photographer Journey | 60%     | BLOCKED     |
| J2: Client Journey       | 50%     | BLOCKED     |
| J3: Payment Journey      | 75%     | PASS (gaps) |
| J4: Refund Journey       | 12%     | FAIL        |
| O1: Monitoring           | 28%     | PARTIAL     |
| O2: Incident Response    | 7%      | NOT READY   |
| O3: Backups              | 11%     | CRITICAL    |
| O4: Support              | 0%      | NOT READY   |
| O5: Compliance           | 28%     | PARTIAL     |
| R1: Error Handling       | 47%     | FUNCTIONAL  |
| R2: Performance          | 80%     | GOOD        |
| R3: Payment Reliability  | 67%     | GOOD (gaps) |
| C1: Pricing              | 53%     | PARTIAL     |
| C2: Onboarding           | 33%     | BLOCKED     |
| C3: Competitive          | PARTIAL | GAPS        |

**Overall Market Readiness: 49%** (Development/Early Beta phase)

---

## Recommended Priority Sequence

### Week 1-2: Unblock Core (P0)

1. Photo upload API + UI
2. Shopping cart component
3. Favorites API endpoints
4. Configure Sentry DSN

### Week 3-4: Stabilize Ops (P1)

5. Database backup automation
6. Payment failure webhook
7. Support email + FAQ
8. Email on manual status changes

### Week 5-6: Polish for Beta (P2)

9. Mobile dashboard
10. Refund webhook
11. Onboarding checklist
12. Uptime monitoring

### Week 7-8: Expand Features (P3)

13. Coupon system
14. Team invitations
15. Analytics dashboard
16. Billing portal

---

_Last Updated: 2026-01-16_
_Next Review: Before each release gate_
