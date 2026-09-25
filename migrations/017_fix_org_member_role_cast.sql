-- 017: Fix org→project sync triggers (enum cast).
-- The CASE expressions in 016 resolved to `text`, so every
-- OrganizationMember insert failed with: column "role" is of type
-- member_role but expression is of type text.
-- Re-creates the three affected functions with explicit casts.

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
