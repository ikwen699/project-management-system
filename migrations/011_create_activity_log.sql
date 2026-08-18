-- 011: Create ActivityLog table
CREATE TABLE IF NOT EXISTS "ActivityLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  action TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  metadata JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON "ActivityLog"("userId");
CREATE INDEX idx_activity_entity ON "ActivityLog"("entityType", "entityId");
