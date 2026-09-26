-- 018: Create Feedback table

CREATE TYPE feedback_category AS ENUM ('BUG', 'SUGGESTION', 'OTHER');
CREATE TYPE feedback_status AS ENUM ('NEW', 'READ', 'RESOLVED');

CREATE TABLE IF NOT EXISTS "Feedback" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  category feedback_category NOT NULL DEFAULT 'OTHER',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  page TEXT,
  status feedback_status NOT NULL DEFAULT 'NEW',
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_status ON "Feedback"("status");
CREATE INDEX idx_feedback_user ON "Feedback"("userId");
CREATE INDEX idx_feedback_created ON "Feedback"("createdAt" DESC);