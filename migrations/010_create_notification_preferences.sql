-- 010: Create NotificationPreferences table
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "emailEnabled" BOOLEAN DEFAULT TRUE,
  "taskAssigned" BOOLEAN DEFAULT TRUE,
  "taskStatusChanged" BOOLEAN DEFAULT TRUE,
  "taskDueSoon" BOOLEAN DEFAULT TRUE,
  "taskOverdue" BOOLEAN DEFAULT TRUE,
  "mentionReceived" BOOLEAN DEFAULT TRUE,
  "memberAdded" BOOLEAN DEFAULT TRUE,
  "milestoneCompleted" BOOLEAN DEFAULT TRUE,
  "projectDeadline" BOOLEAN DEFAULT TRUE,
  "dueSoonDays" INT DEFAULT 3,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
