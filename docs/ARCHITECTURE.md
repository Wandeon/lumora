# Lumora Architecture

## Overview

Lumora is built using **Domain-Driven Design (DDD)** principles with a **Clean Architecture** approach. This document outlines the architectural decisions, patterns, and structure of the codebase.

## Architectural Principles

### 1. Domain-Driven Design (DDD)

The codebase is organized around **bounded contexts** that represent distinct business domains:

| Context                  | Responsibility                                   |
| ------------------------ | ------------------------------------------------ |
| **Identity & Access**    | Tenants, users, authentication, authorization    |
| **Gallery**              | Photo galleries, photos, access codes, favorites |
| **Catalog & Pricing**    | Products, pricing, coupons, discounts            |
| **Orders & Fulfillment** | Order management, line items, shipping           |
| **Payments & Billing**   | Payment processing, subscriptions, invoices      |
| **Notifications**        | Email, push notifications, reminders             |
| **Storage**              | File uploads, CDN management                     |

### 2. Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION                           │
│              (Next.js App Router, API Routes)               │
├─────────────────────────────────────────────────────────────┤
│                      APPLICATION                            │
│           (Use Cases, Commands, Queries, Handlers)          │
├─────────────────────────────────────────────────────────────┤
│                        DOMAIN                               │
│    (Entities, Value Objects, Domain Events, Repositories)   │
├─────────────────────────────────────────────────────────────┤
│                     INFRASTRUCTURE                          │
│        (Database, External APIs, File Storage, Email)       │
└─────────────────────────────────────────────────────────────┘
```

**Dependency Rule**: Dependencies only point inward. The domain layer has no external dependencies.

### 3. SOLID Principles

- **S**ingle Responsibility: Each class/module has one reason to change
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes are substitutable for base types
- **I**nterface Segregation: Many specific interfaces over one general
- **D**ependency Inversion: Depend on abstractions, not concretions

## Directory Structure

```
/src
├── /core                     # Domain Layer
│   ├── /shared               # Shared domain primitives
│   │   ├── entity.ts         # Base Entity class
│   │   ├── aggregate-root.ts # AggregateRoot with domain events
│   │   ├── value-object.ts   # Base ValueObject class
│   │   ├── domain-event.ts   # Domain event interfaces
│   │   └── result.ts         # Result type for error handling
│   │
│   ├── /identity             # Identity & Access Context
│   │   ├── /entities         # Tenant, User
│   │   ├── /value-objects    # Email, TenantSlug
│   │   ├── /events           # TenantCreated, UserInvited
│   │   ├── /repositories     # ITenantRepository (interface)
│   │   └── /services         # Domain services
│   │
│   ├── /gallery              # Gallery Context
│   ├── /catalog              # Catalog Context
│   ├── /orders               # Orders Context
│   ├── /payments             # Payments Context
│   ├── /notifications        # Notifications Context
│   └── /storage              # Storage Context
│
├── /application              # Application Layer
│   ├── /identity
│   │   ├── /commands         # CreateTenant, InviteUser
│   │   ├── /queries          # GetTenantBySlug
│   │   └── /handlers         # Command/Query handlers
│   └── /...
│
├── /infrastructure           # Infrastructure Layer
│   ├── /persistence          # Prisma repositories
│   │   └── /repositories     # Concrete implementations
│   ├── /storage              # R2 adapter
│   ├── /payments             # Stripe adapter
│   ├── /email                # Resend adapter
│   └── /auth                 # Auth.js adapter
│
├── /modules                  # Feature Modules
│   ├── /print-orders         # Print ordering module
│   ├── /payments             # Payment processing module
│   ├── /coupons              # Coupon management module
│   ├── /invoices             # Invoice generation module
│   ├── /gift-cards           # Gift card module
│   ├── /white-label          # White-label customization
│   └── /notifications        # Notification module
│
├── /app                      # Next.js App Router
│   ├── /(marketing)          # Public marketing pages
│   ├── /(auth)               # Authentication pages
│   ├── /(dashboard)          # Admin dashboard
│   ├── /(gallery)            # Public gallery views
│   └── /api                  # API routes
│
└── /shared                   # Shared Utilities
    ├── /lib                  # Helper functions
    ├── /ui                   # Design system components
    └── /config               # Configuration
```

## Multi-Tenancy

### Strategy: Shared Database with Row-Level Isolation

All tenants share the same database with data isolation enforced at the application layer:

```typescript
// Every query includes tenant_id filter
const galleries = await prisma.gallery.findMany({
  where: { tenantId: currentTenantId },
});
```

### Tenant Resolution

1. **Subdomain**: `studio-name.lumora.io` → Extract from hostname
2. **Custom Domain**: `gallery.mystudio.com` → Lookup in database
3. **Header**: `X-Tenant-ID` → For API calls

```typescript
// Middleware pseudo-code
export function resolveTenant(request: Request): Tenant {
  const hostname = request.headers.get('host');

  // Check for custom domain first
  const customDomain = await findTenantByDomain(hostname);
  if (customDomain) return customDomain;

  // Extract subdomain
  const subdomain = extractSubdomain(hostname);
  return await findTenantBySlug(subdomain);
}
```

## Feature Flags

Modules are toggled per-tenant using the `TenantFeatureFlag` model:

```typescript
const features = {
  print_orders: tier >= 'pro',
  payments: tier >= 'pro',
  coupons: tier >= 'pro',
  invoices: tier >= 'studio',
  white_label: tier >= 'studio',
  api_access: tier >= 'studio',
};
```

### Checking Features

```typescript
async function hasFeature(tenantId: string, feature: string): Promise<boolean> {
  const flag = await prisma.tenantFeatureFlag.findUnique({
    where: { tenantId_feature: { tenantId, feature } },
  });
  return flag?.enabled ?? false;
}
```

## Error Handling

### Result Type Pattern

Domain operations return `Result<T, E>` instead of throwing exceptions:

```typescript
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

// Usage
const emailResult = Email.create(input);
if (!emailResult.success) {
  return Result.fail(emailResult.error);
}
```

### Error Categories

| Category       | HTTP Status | Example               |
| -------------- | ----------- | --------------------- |
| Validation     | 400         | Invalid email format  |
| Authentication | 401         | Invalid credentials   |
| Authorization  | 403         | Not allowed to access |
| Not Found      | 404         | Gallery not found     |
| Conflict       | 409         | Slug already taken    |
| Server Error   | 500         | Unexpected error      |

## Security

### OWASP Top 10 Mitigations

| Threat                   | Mitigation                   |
| ------------------------ | ---------------------------- |
| Injection                | Prisma parameterized queries |
| Broken Auth              | Auth.js secure sessions      |
| Sensitive Data           | Encryption at rest, TLS      |
| XXE                      | No XML parsing               |
| Broken Access            | RBAC + tenant isolation      |
| Misconfiguration         | Env validation, CSP headers  |
| XSS                      | React escaping, CSP          |
| Insecure Deserialization | Zod validation               |
| Components               | Dependabot, npm audit        |
| Logging                  | Structured logs, audit trail |

### Authentication Flow

```
User → Login Form → Auth.js → Session Cookie → Middleware → Protected Route
                       ↓
                   Database
                   (verify)
```

### Authorization (RBAC)

| Role   | Permissions                    |
| ------ | ------------------------------ |
| owner  | Full access, can delete tenant |
| admin  | All except tenant deletion     |
| editor | Create/edit galleries, photos  |
| viewer | View only                      |

## Data Flow

### Gallery Access Flow

```
Client Request
     ↓
Middleware (resolve tenant)
     ↓
API Route (/api/gallery/[code])
     ↓
Application Handler (GetGalleryByCode)
     ↓
Domain Service (validate access)
     ↓
Repository (fetch data)
     ↓
Response (gallery data)
```

### Photo Upload Flow

```
Client Upload
     ↓
API Route (/api/upload)
     ↓
Storage Adapter (R2)
     ↓
Image Processing (resize variants)
     ↓
Domain Entity (Photo.create)
     ↓
Repository (save to DB)
     ↓
Domain Event (PhotoUploaded)
     ↓
Event Handler (update gallery count)
```

## Testing Strategy

### Test Pyramid

```
         ╱╲
        ╱  ╲        E2E Tests (Playwright)
       ╱────╲
      ╱      ╲      Integration Tests
     ╱────────╲
    ╱          ╲    Unit Tests (Vitest)
   ╱────────────╲
```

### What to Test

| Layer          | Test Type   | Focus                         |
| -------------- | ----------- | ----------------------------- |
| Domain         | Unit        | Business rules, value objects |
| Application    | Integration | Use cases, handlers           |
| Infrastructure | Integration | Repository implementations    |
| API            | Integration | Request/response contracts    |
| UI             | E2E         | Critical user flows           |

## Performance Considerations

### Database

- Proper indexing on frequently queried columns
- Connection pooling with Prisma
- Query optimization with `select` and `include`

### Images

- WebP format for web delivery
- Multiple size variants (thumbnail, web, original)
- CDN caching with Cloudflare R2

### Caching Strategy

- Static assets: Long cache headers
- API responses: Conditional caching with ETags
- Session data: In-memory with Auth.js

## Deployment

### Recommended Stack

| Component   | Service                   |
| ----------- | ------------------------- |
| Application | Vercel / Cloudflare Pages |
| Database    | Neon / Supabase / Railway |
| Storage     | Cloudflare R2             |
| Email       | Resend                    |
| Payments    | Stripe                    |
| Monitoring  | Sentry + Axiom            |

### Environment Separation

| Environment | Purpose                |
| ----------- | ---------------------- |
| Development | Local development      |
| Preview     | PR previews            |
| Staging     | Pre-production testing |
| Production  | Live environment       |
