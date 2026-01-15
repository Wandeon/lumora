# Lumora Launch Verification Checklists

Use this document to verify progress and collect proof for audit. Every checklist item should be accompanied by the listed proof.

## Marketing and Acquisition

- [ ] `/pricing` page exists with tier comparison and CTA to signup. Proof: URL, screenshot, copy for each tier.
- [ ] `/features` page exists with product feature details. Proof: URL, screenshot.
- [ ] `/about` and `/contact` pages exist. Proof: URL, screenshot.
- [ ] `/terms` and `/privacy` pages exist. Proof: URL, legal text file.
- [ ] Metadata and SEO updated (title, description, OpenGraph). Proof: `src/app/layout.tsx` diff and rendered HTML head.
- [ ] Demo experience available (public gallery or guided demo). Proof: URL, demo instructions.

## Signup and Onboarding

- [ ] Signup page creates a tenant and owner user. Proof: API request/response, DB row in `tenants` and `users`.
- [ ] Email verification flow works. Proof: sample verification email and verified user record.
- [ ] Password reset flow works. Proof: reset email and successful login.
- [ ] Tenant slug validation and reserved word handling. Proof: unit test or screenshots showing blocked values.
- [ ] Onboarding wizard captures studio name, slug, logo, and brand color. Proof: screenshots and DB updates.
- [ ] Trial starts automatically on signup. Proof: subscription record with `trialing` status.

## Subscriptions and Billing

- [ ] Stripe products and prices exist for each tier. Proof: Stripe dashboard screenshots or IDs in config.
- [ ] Subscription checkout flow starts a trial. Proof: checkout session logs and subscription record.
- [ ] Webhooks handle subscription lifecycle: create, update, cancel, invoice paid. Proof: webhook logs and DB updates.
- [ ] Billing settings page exists for plan changes and payment methods. Proof: URL and screenshots.
- [ ] Feature gating enforced on tier and trial state. Proof: test cases or screenshots of blocked access.
- [ ] Trial expiration behavior defined and enforced. Proof: test or DB state transitions.

## Gallery Management

- [ ] Gallery CRUD: create, edit, publish, archive, delete. Proof: API calls and UI screenshots.
- [ ] Access codes can be created, rotated, and revoked. Proof: access code list and DB records.
- [ ] Code-protected galleries enforce access codes. Proof: denied access screenshot and server response.
- [ ] Gallery expiration works. Proof: expired gallery access denial and DB record.
- [ ] Gallery cover photo can be set. Proof: UI update and DB field change.

## Photo Upload and Storage

- [ ] Photo upload flow works end-to-end. Proof: upload request, R2 object list, DB row in `photos`.
- [ ] Image variants are generated (original, web, thumbnail). Proof: keys in storage and rendered gallery.
- [ ] Photo sorting and deletion work. Proof: UI reorder and DB `sort_order` updates.
- [ ] Storage usage tracked and enforced by tier. Proof: usage record and upload blocked at limit.

## Client Gallery Experience

- [ ] Client can access gallery by code from tenant landing page. Proof: URL and screenshots.
- [ ] Favorites are persistent per session or user. Proof: DB records and UI toggle across reload.
- [ ] Download permissions and watermark rules enforced. Proof: download action and configured behavior.

## Products and Catalog

- [ ] Product CRUD (create, edit, deactivate, delete). Proof: API calls and UI screenshots.
- [ ] Product metadata and variants supported. Proof: DB record with metadata and UI display.
- [ ] Product list shows active status and pricing. Proof: UI and API response.

## Orders and Fulfillment

- [ ] Client can add items to cart and create an order. Proof: order record and cart UI.
- [ ] Taxes, discounts, and totals computed correctly. Proof: calculation example and DB totals.
- [ ] Stripe checkout completes and updates order status. Proof: webhook log and DB order status.
- [ ] Success and cancel pages exist. Proof: URL and screenshots.
- [ ] Order confirmation email sent. Proof: email content and delivery log.
- [ ] Admin order list with status updates. Proof: dashboard UI and order status changes.

## Studio Settings and Team

- [ ] Studio profile settings page exists (logo, brand color, contact info). Proof: UI and DB changes.
- [ ] Custom domain setup with validation. Proof: verified domain and routing to tenant.
- [ ] White label controls for Studio tier. Proof: UI toggles and rendered client gallery.
- [ ] Team management with roles and invites. Proof: user list and role enforcement test.
- [ ] API key management remains functional. Proof: key generation and API access test.

## Security, Compliance, and Ops

- [ ] Audit logging for critical actions (signup, billing, orders). Proof: `audit_logs` records.
- [ ] Rate limiting on public APIs and auth endpoints. Proof: configuration and test output.
- [ ] Error monitoring integrated (Sentry or equivalent). Proof: config and test error event.
- [ ] Backups and recovery plan documented. Proof: runbook document and test restore.
- [ ] Data retention policy documented. Proof: policy doc and scheduled job config.

## Docs and Support

- [ ] Public API docs are served in the app or a docs site. Proof: URL and rendered docs.
- [ ] Support contact or help center exists. Proof: URL and support process doc.
- [ ] Status page exists. Proof: URL or provider configuration.

## Testing and Release

- [ ] Unit tests for core domains (gallery, catalog, orders). Proof: test results and coverage report.
- [ ] E2E flows for signup, gallery publish, and checkout. Proof: Playwright run output.
- [ ] Staging environment deployed with seed data. Proof: staging URL and seed script.
- [ ] Release checklist completed and signed off. Proof: checklist file or ticket IDs.

## Audit Evidence Package (what teams should deliver)

- [ ] PR links or changelog for each feature area. Proof: list of PRs.
- [ ] Screenshots or screen recordings for each major flow. Proof: assets folder or shared drive link.
- [ ] Sample API requests and responses. Proof: curl scripts or Postman export.
- [ ] Database migration list and seed data. Proof: migration files and seed output.
- [ ] Stripe test events and invoices. Proof: Stripe dashboard exports.
