-- 004: Create ProjectInvites table
CREATE TYPE invite_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS "ProjectInvite" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  "invitedById" TEXT NOT NULL REFERENCES "User"(id),
  role member_role DEFAULT 'MEMBER',
  token TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  status invite_status DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
