-- 006: Create Tasks table
CREATE TYPE priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE IF NOT EXISTS "Task" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority priority DEFAULT 'MEDIUM',
  deadline TIMESTAMP WITH TIME ZONE,
  position INT NOT NULL,
  "columnId" TEXT NOT NULL REFERENCES "Column"(id) ON DELETE CASCADE,
  "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  "assigneeId" TEXT REFERENCES "User"(id),
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_column ON "Task"("columnId");
CREATE INDEX idx_task_project ON "Task"("projectId");
CREATE INDEX idx_task_assignee ON "Task"("assigneeId");
