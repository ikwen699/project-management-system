-- 016: Organisations, teams, members, invites, and org -> project access sync

-- ---------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------
CREATE TYPE org_role AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE team_role AS ENUM ('LEAD', 'MEMBER');

-- ---------------------------------------------------------------
-- Organisation
-- ---------------------------------------------------------------
CREATE TABLE "Organization" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Business',
  description TEXT,
  "ownerId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organization_owner ON "Organization"("ownerId");

-- ---------------------------------------------------------------
-- Team (belongs to an organisation)
-- ---------------------------------------------------------------
CREATE TABLE "Team" (
  id TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Other',
  description TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("organizationId", name)
);

CREATE INDEX idx_team_org ON "Team"("organizationId");

-- ---------------------------------------------------------------
-- Organisation membership + roles
-- ---------------------------------------------------------------
CREATE TABLE "OrganizationMember" (
  id TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("organizationId", "userId")
);

CREATE INDEX idx_orgmember_org ON "OrganizationMember"("organizationId");
CREATE INDEX idx_orgmember_user ON "OrganizationMember"("userId");

-- ---------------------------------------------------------------
-- Team membership + roles (a member can join multiple teams)
-- ---------------------------------------------------------------
CREATE TABLE "TeamMember" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("teamId", "userId")
);

CREATE INDEX idx_teammember_team ON "TeamMember"("teamId");
CREATE INDEX idx_teammember_user ON "TeamMember"("userId");

-- ---------------------------------------------------------------
-- Email invites (reuses the invite_status enum from migration 004)
-- ---------------------------------------------------------------
CREATE TABLE "Invite" (
  id TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "teamId" TEXT REFERENCES "Team"(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role org_role NOT NULL DEFAULT 'MEMBER',
  "teamRole" team_role NOT NULL DEFAULT 'MEMBER',
  "invitedById" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMPTZ,
  status invite_status NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invite_org ON "Invite"("organizationId");
CREATE INDEX idx_invite_email ON "Invite"(email);

-- ---------------------------------------------------------------
-- Projects can live under an organisation; tasks can be assigned to a team
-- ---------------------------------------------------------------
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "organizationId" TEXT REFERENCES "Organization"(id) ON DELETE SET NULL;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "teamId" TEXT REFERENCES "Team"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_org ON "Project"("organizationId");
CREATE INDEX IF NOT EXISTS idx_task_team ON "Task"("teamId");

-- ---------------------------------------------------------------
-- Notification type for organisation invites
-- ---------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'notification_type'::regtype AND enumlabel = 'ORG_INVITE'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'ORG_INVITE';
  END IF;
END $do$;

-- ---------------------------------------------------------------
-- Access sync: organisation membership materialises into project
-- membership so all existing project queries keep working.
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_org_member_to_projects()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "ProjectMember" (id, "userId", "projectId", role, "joinedAt")
  SELECT gen_random_uuid()::text, NEW."userId", p.id,
         (CASE WHEN NEW.role = 'ADMIN' THEN 'ADMIN' ELSE 'MEMBER' END)::member_role,
         NEW."joinedAt"
  FROM "Project" p
  WHERE p."organizationId" = NEW."organizationId"
    AND NOT EXISTS (
      SELECT 1 FROM "ProjectMember" pm
      WHERE pm."projectId" = p.id AND pm."userId" = NEW."userId"
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orgmember_insert
  AFTER INSERT ON "OrganizationMember"
  FOR EACH ROW EXECUTE FUNCTION sync_org_member_to_projects();

CREATE OR REPLACE FUNCTION sync_org_member_role_to_projects()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS NOT DISTINCT FROM NEW.role THEN RETURN NEW; END IF;
  UPDATE "ProjectMember" pm
  SET role = (CASE WHEN NEW.role = 'ADMIN' THEN 'ADMIN' ELSE 'MEMBER' END)::member_role
  FROM "Project" p
  WHERE p."organizationId" = NEW."organizationId"
    AND pm."projectId" = p.id
    AND pm."userId" = NEW."userId"
    AND pm.role <> 'OWNER';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orgmember_update
  AFTER UPDATE ON "OrganizationMember"
  FOR EACH ROW EXECUTE FUNCTION sync_org_member_role_to_projects();

CREATE OR REPLACE FUNCTION remove_org_member_from_projects()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM "ProjectMember" pm
  USING "Project" p
  WHERE p."organizationId" = OLD."organizationId"
    AND pm."projectId" = p.id
    AND pm."userId" = OLD."userId"
    AND pm.role <> 'OWNER';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orgmember_delete
  AFTER DELETE ON "OrganizationMember"
  FOR EACH ROW EXECUTE FUNCTION remove_org_member_from_projects();

-- When a project is attached to an organisation, backfill access for all
-- existing organisation members.
CREATE OR REPLACE FUNCTION sync_project_org_members()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."organizationId" IS NOT NULL
     AND NEW."organizationId" IS DISTINCT FROM OLD."organizationId" THEN
    INSERT INTO "ProjectMember" (id, "userId", "projectId", role, "joinedAt")
    SELECT gen_random_uuid()::text, om."userId", NEW.id,
           (CASE WHEN om.role = 'ADMIN' THEN 'ADMIN' ELSE 'MEMBER' END)::member_role,
           NOW()
    FROM "OrganizationMember" om
    WHERE om."organizationId" = NEW."organizationId"
      AND NOT EXISTS (
        SELECT 1 FROM "ProjectMember" pm
        WHERE pm."projectId" = NEW.id AND pm."userId" = om."userId"
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_project_org
  AFTER UPDATE OF "organizationId" ON "Project"
  FOR EACH ROW EXECUTE FUNCTION sync_project_org_members();