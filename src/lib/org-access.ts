import { supabase } from "./supabase";
import type { OrgRole, TeamRole } from "@/types";
import type { Session } from "next-auth";

export function isSuperAdmin(session: Session | null): boolean {
  return (session?.user as any)?.role === "SUPER_ADMIN";
}

export async function getOrgMemberRole(
  organizationId: string,
  userId: string
): Promise<OrgRole | null> {
  const { data } = await supabase
    .from("OrganizationMember")
    .select("role")
    .eq("organizationId", organizationId)
    .eq("userId", userId)
    .maybeSingle();
  return (data?.role as OrgRole) || null;
}

export async function isOrgAdmin(
  organizationId: string,
  userId: string
): Promise<boolean> {
  return (await getOrgMemberRole(organizationId, userId)) === "ADMIN";
}

export async function getTeamMemberRole(
  teamId: string,
  userId: string
): Promise<TeamRole | null> {
  const { data } = await supabase
    .from("TeamMember")
    .select("role")
    .eq("teamId", teamId)
    .eq("userId", userId)
    .maybeSingle();
  return (data?.role as TeamRole) || null;
}

/**
 * Adds a user to an organisation (with role) and optionally to a team (with
 * team role). Idempotent: existing memberships are left unchanged. Existing
 * membership rows gate the inserts, and the Postgres triggers handle project
 * access sync.
 */
export async function addUserToOrgAndTeam(params: {
  organizationId: string;
  userId: string;
  role: OrgRole;
  teamId?: string | null;
  teamRole?: TeamRole;
}): Promise<void> {
  const { data: existingOrg } = await supabase
    .from("OrganizationMember")
    .select("id")
    .eq("organizationId", params.organizationId)
    .eq("userId", params.userId)
    .maybeSingle();

  if (!existingOrg) {
    await supabase.from("OrganizationMember").insert({
      id: crypto.randomUUID(),
      organizationId: params.organizationId,
      userId: params.userId,
      role: params.role,
    });
  }

  if (params.teamId) {
    const { data: existingTeam } = await supabase
      .from("TeamMember")
      .select("id")
      .eq("teamId", params.teamId)
      .eq("userId", params.userId)
      .maybeSingle();

    if (!existingTeam) {
      await supabase.from("TeamMember").insert({
        id: crypto.randomUUID(),
        teamId: params.teamId,
        userId: params.userId,
        role: params.teamRole || "MEMBER",
      });
    }
  }
}