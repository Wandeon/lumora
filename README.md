# Lumora

**Photo Studio SaaS Platform** — Secure galleries, print orders, payments, and more.

Lumora is a modern, multi-tenant platform designed for professional photographers and photo studios. It provides secure client gallery delivery, e-commerce capabilities, and comprehensive business management tools.

## Features

### Core Platform

- **Multi-tenant Architecture** — Each studio gets their own subdomain (`studio.lumora.io`)
- **White-label Support** — Premium tier allows custom domains
- **Feature Flags** — Modular features enabled per tenant/tier

### Gallery Management

- **Secure Galleries** — Code-protected access for client privacy
- **Photo Management** — Upload, organize, and deliver photos
- **Favorites** — Clients can mark favorite photos
- **Expiration** — Time-limited gallery access

### E-commerce (Pro+ Tiers)

- **Print Orders** — Sell prints, magnets, canvases, albums
- **Payment Processing** — Stripe integration
- **Coupons & Discounts** — Promotional pricing tools
- **Invoicing** — Professional invoice generation

### Business Tools (Studio Tier)

- **Multi-user Admin** — Team management with roles
- **Analytics** — Gallery views, downloads, sales tracking
- **Notifications** — Email reminders and updates
- **API Access** — Integrate with other tools

## Tech Stack

| Layer      | Technology               |
| ---------- | ------------------------ |
| Framework  | Next.js 15 (App Router)  |
| Language   | TypeScript (strict mode) |
| Database   | PostgreSQL + Prisma      |
| Styling    | Tailwind CSS             |
| Auth       | Auth.js v5               |
| Payments   | Stripe                   |
| Storage    | Cloudflare R2            |
| Email      | Resend                   |
| Validation | Zod                      |

## Architecture

Lumora follows **Domain-Driven Design (DDD)** with a clean architecture approach:

```
/src
├── /core                 # Domain layer (pure business logic)
│   ├── /identity         # Tenants, Users, Auth
│   ├── /gallery          # Galleries, Photos
│   ├── /catalog          # Products, Pricing
│   ├── /orders           # Orders, Fulfillment
│   ├── /payments         # Payments, Subscriptions
│   ├── /notifications    # Email, Push
│   └── /storage          # File management
│
├── /application          # Use cases (commands/queries)
├── /infrastructure       # External adapters (DB, APIs)
├── /modules              # Feature modules (toggleable)
├── /app                  # Next.js pages & routes
└── /shared               # Utilities & UI components
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed documentation.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Wandeon/lumora.git
cd lumora

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lumora"

# Auth
AUTH_SECRET="your-auth-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudflare R2
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="lumora"
R2_ENDPOINT="https://..."

# Email (Resend)
RESEND_API_KEY="re_..."
```

## Scripts

| Command               | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start development server |
| `npm run build`       | Build for production     |
| `npm run start`       | Start production server  |
| `npm run lint`        | Run ESLint               |
| `npm run lint:fix`    | Fix ESLint issues        |
| `npm run format`      | Format with Prettier     |
| `npm run typecheck`   | TypeScript type checking |
| `npm run db:generate` | Generate Prisma client   |
| `npm run db:migrate`  | Run database migrations  |
| `npm run db:studio`   | Open Prisma Studio       |
| `npm run test`        | Run unit tests (watch)   |
| `npm run test:run`    | Run unit tests once      |
| `npm run test:e2e`    | Run E2E tests            |
| `npm run test:e2e:ui` | Run E2E tests with UI    |

## Testing

```bash
# Run unit tests in watch mode
npm run test

# Run unit tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with interactive UI
npm run test:e2e:ui
```

## API Documentation

Lumora provides a public API for Studio tier tenants. See [docs/API.md](docs/API.md) for complete documentation.

## Pricing Tiers

| Tier        | Target        | Key Features                             |
| ----------- | ------------- | ---------------------------------------- |
| **Starter** | Hobbyists     | Galleries, code access, downloads        |
| **Pro**     | Professionals | + Print orders, payments, coupons        |
| **Studio**  | Agencies      | + Multi-user, white-label, API, invoices |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary — All rights reserved.

## Links

- [Architecture Documentation](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [ADR: DDD Architecture](docs/adr/001-ddd-architecture.md)
- [ADR: Multi-Tenancy](docs/adr/002-multi-tenancy-strategy.md)
- [ADR: Feature Flags](docs/adr/003-feature-flag-system.md)
