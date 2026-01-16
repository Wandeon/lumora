-- Enable pgcrypto for gen_random_uuid() on PostgreSQL < 13
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "stripe_session_id" VARCHAR(255);
ALTER TABLE "orders" ADD COLUMN "access_token" VARCHAR(36) DEFAULT gen_random_uuid();

-- Generate access tokens for existing orders
UPDATE "orders" SET "access_token" = gen_random_uuid() WHERE "access_token" IS NULL;

-- Make access_token NOT NULL and add unique constraint
ALTER TABLE "orders" ALTER COLUMN "access_token" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "access_token" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "orders_access_token_key" ON "orders"("access_token");
