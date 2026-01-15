# syntax=docker/dockerfile:1

# Base image with Node.js
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build arguments for environment validation at build time
ARG DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
ARG AUTH_SECRET="placeholder-secret-at-least-32-characters"
ARG STRIPE_SECRET_KEY="sk_test_placeholder"
ARG STRIPE_PUBLISHABLE_KEY="pk_test_placeholder"
ARG STRIPE_WEBHOOK_SECRET="whsec_placeholder"
ARG R2_ACCESS_KEY_ID="placeholder"
ARG R2_SECRET_ACCESS_KEY="placeholder"
ARG R2_BUCKET="placeholder"
ARG R2_ENDPOINT="https://placeholder.r2.cloudflarestorage.com"
ARG R2_PUBLIC_URL="https://placeholder.example.com"
ARG RESEND_API_KEY="re_placeholder"
ARG EMAIL_FROM="noreply@placeholder.com"
ARG NEXT_PUBLIC_APP_URL="https://placeholder.example.com"
ARG NEXT_PUBLIC_APP_NAME="Lumora"

# Set environment variables for build
ENV DATABASE_URL=$DATABASE_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
ENV R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID
ENV R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY
ENV R2_BUCKET=$R2_BUCKET
ENV R2_ENDPOINT=$R2_ENDPOINT
ENV R2_PUBLIC_URL=$R2_PUBLIC_URL
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV EMAIL_FROM=$EMAIL_FROM
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma schema and generated client for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
