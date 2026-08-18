-- 009: Create Notifications table
CREATE TYPE notification_type AS ENUM (
  'TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'TASK_DUE_SOON', 'TASK_OVERDUE',
  'MENTION_RECEIVED', 'PROJECT_MEMBER_ADDED', 'MILESTONE_COMPLETED', 'PROJECT_DEADLINE_APPROACHING'
);

CREATE TABLE IF NOT EXISTS "Notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  "isRead" BOOLEAN DEFAULT FALSE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "senderId" TEXT REFERENCES "User"(id),
  "projectId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_user ON "Notification"("userId");
CREATE INDEX idx_notification_unread ON "Notification"("userId", "isRead");
