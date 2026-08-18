-- 013: Time tracking and file attachments

-- Add time tracking columns to Task
ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "estimatedHours" NUMERIC,
  ADD COLUMN IF NOT EXISTS "timeSpent" NUMERIC DEFAULT 0;

-- TimeEntry: individual time log entries
CREATE TABLE IF NOT EXISTS "TimeEntry" (
  id TEXT PRIMARY KEY,
  "taskId" TEXT NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  description TEXT,
  "startTime" TIMESTAMPTZ NOT NULL,
  "endTime" TIMESTAMPTZ,
  duration INT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeentry_task ON "TimeEntry"("taskId");

-- FileAttachment: file metadata
CREATE TABLE IF NOT EXISTS "FileAttachment" (
  id TEXT PRIMARY KEY,
  "taskId" TEXT NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "fileName" TEXT NOT NULL,
  "fileType" TEXT,
  "fileSize" INT,
  "fileUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachment_task ON "FileAttachment"("taskId");

-- Update get_task_detail RPC to include time entries and attachments
CREATE OR REPLACE FUNCTION get_task_detail(p_task_id TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', t.id, 'title', t.title, 'description', t.description,
    'priority', t.priority, 'deadline', t.deadline, 'position', t.position,
    'columnId', t."columnId", 'projectId', t."projectId",
    'assigneeId', t."assigneeId", 'completedAt', t."completedAt",
    'createdAt', t."createdAt", 'updatedAt', t."updatedAt",
    'estimatedHours', t."estimatedHours", 'timeSpent', t."timeSpent",
    'columnName', c.name,
    'assigneeName', assignee.name, 'assigneeAvatar', assignee.avatar,
    'timeEntries', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', te.id, 'description', te.description,
        'startTime', te."startTime", 'endTime', te."endTime",
        'duration', te.duration, 'userName', u.name
      ) ORDER BY te."startTime" DESC), '[]')
      FROM "TimeEntry" te
      LEFT JOIN "User" u ON u.id = te."userId"
      WHERE te."taskId" = t.id
    ),
    'attachments', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', fa.id, 'fileName', fa."fileName", 'fileType', fa."fileType",
        'fileSize', fa."fileSize", 'fileUrl', fa."fileUrl",
        'userName', au.name, 'createdAt', fa."createdAt"
      ) ORDER BY fa."createdAt" DESC), '[]')
      FROM "FileAttachment" fa
      LEFT JOIN "User" au ON au.id = fa."userId"
      WHERE fa."taskId" = t.id
    )
  )
  FROM "Task" t
  INNER JOIN "Column" c ON c.id = t."columnId"
  LEFT JOIN "User" assignee ON assignee.id = t."assigneeId"
  WHERE t.id = p_task_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Update get_project_tasks to include estimated/timeSpent
DROP FUNCTION IF EXISTS get_project_tasks(TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION get_project_tasks(
  p_project_id TEXT, p_priority TEXT DEFAULT NULL,
  p_assignee_id TEXT DEFAULT NULL, p_column_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT, title TEXT, description TEXT, priority TEXT, deadline TIMESTAMPTZ,
  "position" INT, "columnId" TEXT, "projectId" TEXT, "assigneeId" TEXT,
  "completedAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ, "updatedAt" TIMESTAMPTZ,
  "estimatedHours" NUMERIC, "timeSpent" NUMERIC,
  "columnName" TEXT, "assigneeName" TEXT, "assigneeAvatar" TEXT
) AS $$
  SELECT t.id, t.title, t.description, t.priority, t.deadline,
    t.position, t."columnId", t."projectId", t."assigneeId",
    t."completedAt", t."createdAt", t."updatedAt",
    t."estimatedHours", t."timeSpent",
    c.name as "columnName", assignee.name as "assigneeName", assignee.avatar as "assigneeAvatar"
  FROM "Task" t
  INNER JOIN "Column" c ON c.id = t."columnId"
  LEFT JOIN "User" assignee ON assignee.id = t."assigneeId"
  WHERE t."projectId" = p_project_id
    AND (p_priority IS NULL OR t.priority = p_priority::"priority")
    AND (p_assignee_id IS NULL OR t."assigneeId" = p_assignee_id)
    AND (p_column_id IS NULL OR t."columnId" = p_column_id)
  ORDER BY t.position ASC;
$$ LANGUAGE sql SECURITY DEFINER;
