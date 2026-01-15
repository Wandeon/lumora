# Lumora Launch Roadmap

This roadmap translates the gaps into implementable phases with dependencies and exit criteria. It is written to be handed to engineering teams.

## Phase 0 - Decisions and Foundations (1-2 weeks)

Goals:

- Freeze pricing, trial policy, and tier limits.
- Define onboarding and studio setup flow.
- Align on required legal/compliance artifacts.

Deliverables:

- Pricing matrix and tier limits document.
- Stripe product/price plan and identifiers.
- Trial policy (length, conversion, dunning).
- Legal pages content (terms, privacy, DPA).
- UX flows for signup, onboarding, checkout, and billing.

Exit criteria:

- Product and design sign-off on tiers and UX.
- Stripe test products created.

## Phase 1 - Marketing and Signup (2-3 weeks)

Goals:

- Enable visitors to understand value and start a trial.
- Create tenant + owner account on signup.

Deliverables:

- Marketing pages: `/pricing`, `/features`, `/about`, `/contact`.
- Legal pages: `/terms`, `/privacy`, `/security`.
- Signup flow with email verification.
- Tenant provisioning and subdomain routing.
- Onboarding wizard (studio name, slug, logo, brand color).
- Demo gallery or interactive demo route.

Dependencies:

- Phase 0 pricing and branding decisions.

Exit criteria:

- A new user can sign up, verify email, and reach the dashboard.
- Pricing page supports CTA to trial.

## Phase 2 - Core Studio Management (3-4 weeks)

Goals:

- Studios can create, manage, and deliver galleries.

Deliverables:

- Gallery CRUD with publish/archive.
- Access code management and enforcement.
- Photo upload pipeline (signed upload or multipart), processing, and storage.
- Photo management: sorting, cover photo, delete.
- Favorites persistence.
- Storage usage tracking and tier enforcement.

Dependencies:

- Phase 1 signup and tenant provisioning.

Exit criteria:

- Studio can upload photos and publish a gallery.
- Client can access gallery by code and browse photos.

## Phase 3 - Commerce and Orders (3-4 weeks)

Goals:

- Clients can purchase prints and studios can fulfill orders.

Deliverables:

- Product catalog CRUD with variants/metadata.
- Client selection and cart flow.
- Order creation with discounts/taxes.
- Stripe checkout for order payments.
- Order confirmation emails.
- Admin order list with status updates.

Dependencies:

- Phase 2 gallery and photo management.

Exit criteria:

- End-to-end order: select product -> pay -> order status updates.

## Phase 4 - Subscriptions and Billing (2-3 weeks)

Goals:

- SaaS billing and plan enforcement.

Deliverables:

- Stripe subscription checkout for plans and trial.
- Webhooks for subscription lifecycle.
- Billing settings page for plan changes and payment methods.
- Feature gating enforcement by tier and trial state.
- Invoices and receipts.

Dependencies:

- Phase 0 pricing decisions.
- Phase 1 signup and tenant creation.

Exit criteria:

- Trial converts to paid or is suspended on expiry.
- Plan upgrades/downgrades are reflected in feature access.

## Phase 5 - Ops, Compliance, and Launch Hardening (2-3 weeks)

Goals:

- Production readiness and auditability.

Deliverables:

- Audit logs for critical actions.
- Rate limiting and abuse controls.
- Monitoring and alerting (errors, uptime, payments).
- Support and status pages.
- Full QA regression and e2e coverage.

Exit criteria:

- Release checklist complete, monitoring live, and support process in place.

## Parallelization Notes

- Frontend and backend can run in parallel by phase, but plan and price definitions are upstream of most work.
- Marketing pages and legal pages can start immediately after Phase 0 sign-off.
- Photo upload and gallery management should start early because downstream features depend on it.
