import { supabase } from "./supabase";

export interface PurgeResult {
  deleted: string[];
  skipped: { userId: string; reason: string }[];
}

async function purgeUserDeps(supabaseClient: typeof supabase, userId: string) {
  await supabaseClient.from("Task").update({ assigneeId: null }).eq("assigneeId", userId);
  await supabaseClient.from("Notification").update({ senderId: null }).eq("senderId", userId);
  await supabaseClient.from("TimeEntry").delete().eq("userId", userId);
  await supabaseClient.from("FileAttachment").delete().eq("userId", userId);
  await supabaseClient.from("ActivityLog").delete().eq("userId", userId);
}

export async function purgeUsers(
  userIds: string[],
  actorId: string
): Promise<PurgeResult> {
  const { count: adminCount } = await supabase
    .from("User")
    .select("id", { count: "exact", head: true })
    .eq("role", "SUPER_ADMIN");

  const deleted: string[] = [];
  const skipped: { userId: string; reason: string }[] = [];

  for (const userId of userIds) {
    if (actorId && userId === actorId) {
      skipped.push({ userId, reason: "Cannot delete your own account" });
      continue;
    }

    const { data: targetUser } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .single();

    if (targetUser?.role === "SUPER_ADMIN" && adminCount !== null && adminCount <= 1) {
      skipped.push({ userId, reason: "Cannot delete the last super admin" });
      continue;
    }

    try {
      await purgeUserDeps(supabase, userId);
      const { error } = await supabase.from("User").delete().eq("id", userId);
      if (error) {
        skipped.push({ userId, reason: error.message });
        continue;
      }
      deleted.push(userId);
    } catch (e: any) {
      skipped.push({ userId, reason: e?.message || "Unknown error" });
    }
  }

  return { deleted, skipped };
}

export async function purgePastDueUsers(): Promise<PurgeResult> {
  const { data: dueUsers, error } = await supabase
    .from("User")
    .select("id")
    .not("removalScheduledAt", "is", null)
    .lte("removalScheduledAt", new Date().toISOString());

  if (error || !dueUsers || dueUsers.length === 0) {
    return { deleted: [], skipped: [] };
  }

  const userIds = dueUsers.map((u) => u.id);
  return purgeUsers(userIds, "");
}