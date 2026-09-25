import { supabase } from "./supabase";

export async function resolveTaskTeam(
  projectId: string,
  teamId: string | null
): Promise<{ teamId: string | null; error?: string }> {
  if (!teamId) return { teamId: null };

  const { data: project } = await supabase
    .from("Project")
    .select("organizationId")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || !project.organizationId) {
    return { teamId: null, error: "This project has no organisation" };
  }

  const { data: team } = await supabase
    .from("Team")
    .select("id")
    .eq("id", teamId)
    .eq("organizationId", project.organizationId)
    .maybeSingle();

  if (!team) {
    return {
      teamId: null,
      error: "Team is not part of this project's organisation",
    };
  }

  return { teamId };
}

export async function isTeamMember(
  teamId: string | null,
  userId: string | null
): Promise<boolean> {
  if (!userId || !teamId) return true;
  const { data } = await supabase
    .from("TeamMember")
    .select("id")
    .eq("teamId", teamId)
    .eq("userId", userId)
    .maybeSingle();
  return !!data;
}