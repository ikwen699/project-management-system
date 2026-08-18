-- Complex query functions for Supabase RPC calls
-- Run this in Supabase SQL Editor before using the app

-- 1. List projects with task counts
CREATE OR REPLACE FUNCTION get_projects(p_user_id TEXT)
RETURNS TABLE (
  id TEXT, name TEXT, description TEXT, status TEXT, "isArchived" BOOLEAN,
  "startDate" TIMESTAMPTZ, "endDate" TIMESTAMPTZ, "ownerId" TEXT,
  "createdAt" TIMESTAMPTZ, "updatedAt" TIMESTAMPTZ,
  "taskCount" BIGINT, "completedTasks" BIGINT
) AS $$
  SELECT p.*, 
    (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p.id) as "taskCount",
    (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p.id AND "columnId" IN (SELECT id FROM "Column" WHERE "projectId" = p.id AND name = 'Done')) as "completedTasks"
  FROM "Project" p
  INNER JOIN "ProjectMember" pm ON pm."projectId" = p.id
  WHERE pm."userId" = p_user_id AND p."isArchived" = FALSE
  ORDER BY p."updatedAt" DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. List archived projects
CREATE OR REPLACE FUNCTION get_archived_projects(p_user_id TEXT)
RETURNS TABLE (
  id TEXT, name TEXT, description TEXT, status TEXT, "isArchived" BOOLEAN,
  "startDate" TIMESTAMPTZ, "endDate" TIMESTAMPTZ, "ownerId" TEXT,
  "createdAt" TIMESTAMPTZ, "updatedAt" TIMESTAMPTZ,
  "taskCount" BIGINT
) AS $$
  SELECT p.*,
    (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p.id) as "taskCount"
  FROM "Project" p
  INNER JOIN "ProjectMember" pm ON pm."projectId" = p.id
  WHERE pm."userId" = p_user_id AND p."isArchived" = TRUE
  ORDER BY p."updatedAt" DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Get project detail with members and columns+tasks
CREATE OR REPLACE FUNCTION get_project_detail(p_project_id TEXT, p_user_id TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', p.id, 'name', p.name, 'description', p.description,
    'status', p.status, 'isArchived', p."isArchived",
    'startDate', p."startDate", 'endDate', p."endDate",
    'ownerId', p."ownerId", 'createdAt', p."createdAt", 'updatedAt', p."updatedAt",
    'taskCount', (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p.id),
    'memberCount', (SELECT COUNT(*) FROM "ProjectMember" WHERE "projectId" = p.id),
    'members', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', pm.id, 'userId', pm."userId", 'projectId', pm."projectId",
        'role', pm.role, 'joinedAt', pm."joinedAt",
        'userName', u.name, 'userEmail', u.email, 'userAvatar', u.avatar
      ) ORDER BY pm."joinedAt"), '[]')
      FROM "ProjectMember" pm
      INNER JOIN "User" u ON u.id = pm."userId"
      WHERE pm."projectId" = p.id
    ),
    'columns', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', c.id, 'name', c.name, 'position', c.position,
        'projectId', c."projectId", 'createdAt', c."createdAt",
        'tasks', (
          SELECT COALESCE(json_agg(json_build_object(
            'id', t.id, 'title', t.title, 'description', t.description,
            'priority', t.priority, 'deadline', t.deadline, 'position', t.position,
            'columnId', t."columnId", 'projectId', t."projectId",
            'assigneeId', t."assigneeId", 'completedAt', t."completedAt",
            'createdAt', t."createdAt", 'updatedAt', t."updatedAt",
            'assigneeName', assignee.name, 'assigneeAvatar', assignee.avatar
          ) ORDER BY t.position), '[]')
          FROM "Task" t
          LEFT JOIN "User" assignee ON assignee.id = t."assigneeId"
          WHERE t."columnId" = c.id
        )
      ) ORDER BY c.position), '[]')
      FROM "Column" c
      WHERE c."projectId" = p.id
    )
  )
  FROM "Project" p
  INNER JOIN "ProjectMember" pm ON pm."projectId" = p.id
  WHERE p.id = p_project_id AND pm."userId" = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Get columns with tasks for a project
CREATE OR REPLACE FUNCTION get_columns_with_tasks(p_project_id TEXT)
RETURNS TABLE (
  id TEXT, name TEXT, "position" INT, "projectId" TEXT, "createdAt" TIMESTAMPTZ,
  tasks JSON
) AS $$
  SELECT c.id, c.name, c.position, c."projectId", c."createdAt",
    COALESCE(
      (SELECT json_agg(json_build_object(
        'id', t.id, 'title', t.title, 'description', t.description,
        'priority', t.priority, 'deadline', t.deadline, 'position', t.position,
        'columnId', t."columnId", 'projectId', t."projectId",
        'assigneeId', t."assigneeId", 'completedAt', t."completedAt",
        'createdAt', t."createdAt", 'updatedAt', t."updatedAt",
        'assigneeName', assignee.name, 'assigneeAvatar', assignee.avatar
      ) ORDER BY t.position)
      FROM "Task" t
      LEFT JOIN "User" assignee ON assignee.id = t."assigneeId"
      WHERE t."columnId" = c.id),
      '[]'::json
    ) as tasks
  FROM "Column" c
  WHERE c."projectId" = p_project_id
  ORDER BY c.position;
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Get project progress stats
CREATE OR REPLACE FUNCTION get_project_progress(p_project_id TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'totalTasks', (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p_project_id),
    'completedTasks', (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p_project_id AND "columnId" IN (SELECT id FROM "Column" WHERE "projectId" = p_project_id AND name = 'Done')),
    'assignedTasks', (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p_project_id AND "assigneeId" IS NOT NULL),
    'overdueTasks', (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p_project_id AND deadline IS NOT NULL AND deadline < NOW() AND "columnId" NOT IN (SELECT id FROM "Column" WHERE "projectId" = p_project_id AND name = 'Done')),
    'dueSoonTasks', (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p_project_id AND deadline IS NOT NULL AND deadline <= NOW() + INTERVAL '3 days' AND "columnId" NOT IN (SELECT id FROM "Column" WHERE "projectId" = p_project_id AND name = 'Done'))
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Get calendar events
CREATE OR REPLACE FUNCTION get_calendar_events(p_user_id TEXT, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS JSON AS $$
  SELECT json_agg(e ORDER BY e.date) FROM (
    SELECT t.id, t.title, t.deadline as date, 'task' as type, t."projectId", p.name as "projectName",
      CASE WHEN t.priority = 'URGENT' THEN '#ef4444' WHEN t.priority = 'HIGH' THEN '#f97316' ELSE '#3b82f6' END as color
    FROM "Task" t
    INNER JOIN "Project" p ON p.id = t."projectId"
    INNER JOIN "ProjectMember" pm ON pm."projectId" = p.id
    WHERE pm."userId" = p_user_id AND t.deadline IS NOT NULL
      AND t.deadline BETWEEN p_start AND p_end
    UNION ALL
    SELECT m.id, m.title, m.date, 'milestone' as type, m."projectId", p.name as "projectName",
      '#a855f7' as color
    FROM "Milestone" m
    INNER JOIN "Project" p ON p.id = m."projectId"
    INNER JOIN "ProjectMember" pm ON pm."projectId" = p.id
    WHERE pm."userId" = p_user_id AND m.date BETWEEN p_start AND p_end
    UNION ALL
    SELECT mt.id, mt.title, mt.date, 'meeting' as type, mt."projectId", p.name as "projectName",
      '#f59e0b' as color
    FROM "Meeting" mt
    INNER JOIN "Project" p ON p.id = mt."projectId"
    INNER JOIN "ProjectMember" pm ON pm."projectId" = p.id
    WHERE pm."userId" = p_user_id AND mt.date BETWEEN p_start AND p_end
    UNION ALL
    SELECT p2.id, p2.name, p2."startDate" as date, 'project_start' as type, p2.id as "projectId", p2.name as "projectName",
      '#22c55e' as color
    FROM "Project" p2
    INNER JOIN "ProjectMember" pm ON pm."projectId" = p2.id
    WHERE pm."userId" = p_user_id AND p2."startDate" IS NOT NULL
      AND p2."startDate" BETWEEN p_start AND p_end
    UNION ALL
    SELECT p2.id, p2.name || ' deadline', p2."endDate" as date, 'project_end' as type, p2.id as "projectId", p2.name as "projectName",
      '#ef4444' as color
    FROM "Project" p2
    INNER JOIN "ProjectMember" pm ON pm."projectId" = p2.id
    WHERE pm."userId" = p_user_id AND p2."endDate" IS NOT NULL
      AND p2."endDate" BETWEEN p_start AND p_end
  ) e;
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Get dashboard metrics
CREATE OR REPLACE FUNCTION get_metrics(p_user_id TEXT)
RETURNS JSON AS $$
  WITH user_projects AS (
    SELECT p.id, p.status, p."endDate" FROM "Project" p
    INNER JOIN "ProjectMember" pm ON pm."projectId" = p.id
    WHERE pm."userId" = p_user_id AND p."isArchived" = FALSE
  ),
  user_tasks AS (
    SELECT t.*, c.name as col_name FROM "Task" t
    INNER JOIN "Project" p ON p.id = t."projectId"
    INNER JOIN "ProjectMember" pm ON pm."projectId" = p.id
    INNER JOIN "Column" c ON c.id = t."columnId"
    WHERE pm."userId" = p_user_id
  )
  SELECT json_build_object(
    'totalProjects', (SELECT COUNT(*) FROM user_projects),
    'projectsWithTasks', (SELECT COUNT(DISTINCT p.id) FROM "Project" p INNER JOIN "ProjectMember" pm ON pm."projectId" = p.id INNER JOIN "Task" t ON t."projectId" = p.id WHERE pm."userId" = p_user_id AND p."isArchived" = FALSE),
    'totalTasks', (SELECT COUNT(*) FROM user_tasks),
    'completedTasks', (SELECT COUNT(*) FROM user_tasks WHERE col_name = 'Done'),
    'assignedTasks', (SELECT COUNT(*) FROM user_tasks WHERE "assigneeId" IS NOT NULL),
    'overdueTasks', (SELECT COUNT(*) FROM user_tasks WHERE deadline < NOW() AND col_name != 'Done'),
    'onTimeTasks', (SELECT COUNT(*) FROM user_tasks WHERE col_name = 'Done' AND "completedAt" <= deadline),
    'totalCompletedProjects', (SELECT COUNT(*) FROM user_projects WHERE status = 'COMPLETED'),
    'completedOnTimeProjects', (SELECT COUNT(*) FROM user_projects WHERE status = 'COMPLETED' AND "endDate" >= NOW()),
    'avgCompletionDays', COALESCE((SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 86400) FROM user_tasks WHERE col_name = 'Done' AND "completedAt" IS NOT NULL), 0)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 8. Get task detail with join
CREATE OR REPLACE FUNCTION get_task_detail(p_task_id TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', t.id, 'title', t.title, 'description', t.description,
    'priority', t.priority, 'deadline', t.deadline, 'position', t.position,
    'columnId', t."columnId", 'projectId', t."projectId",
    'assigneeId', t."assigneeId", 'completedAt', t."completedAt",
    'createdAt', t."createdAt", 'updatedAt', t."updatedAt",
    'columnName', c.name,
    'assigneeName', assignee.name, 'assigneeAvatar', assignee.avatar
  )
  FROM "Task" t
  INNER JOIN "Column" c ON c.id = t."columnId"
  LEFT JOIN "User" assignee ON assignee.id = t."assigneeId"
  WHERE t.id = p_task_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 9. Get tasks with filters
CREATE OR REPLACE FUNCTION get_project_tasks(
  p_project_id TEXT, p_priority TEXT DEFAULT NULL,
  p_assignee_id TEXT DEFAULT NULL, p_column_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT, title TEXT, description TEXT, priority TEXT, deadline TIMESTAMPTZ,
  "position" INT, "columnId" TEXT, "projectId" TEXT, "assigneeId" TEXT,
  "completedAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ, "updatedAt" TIMESTAMPTZ,
  "columnName" TEXT, "assigneeName" TEXT, "assigneeAvatar" TEXT
) AS $$
  SELECT t.id, t.title, t.description, t.priority, t.deadline,
    t.position, t."columnId", t."projectId", t."assigneeId",
    t."completedAt", t."createdAt", t."updatedAt",
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
