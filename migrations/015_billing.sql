-- 015: Billing — plan fields on User + Payment table

-- Plan fields on User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS "planStatus" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMPTZ;

-- Payment: one row per Paystack transaction
CREATE TABLE IF NOT EXISTS "Payment" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "txRef" TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'pending',
  plan TEXT NOT NULL DEFAULT 'business',
  "planExpiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_user ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS idx_payment_txref ON "Payment"("txRef");