-- 003: Create ProjectMembers table
CREATE TYPE member_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

CREATE TABLE IF NOT EXISTS "ProjectMember" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  role member_role DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "projectId")
);
