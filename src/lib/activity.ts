import { supabase } from "./supabase";

interface LogActivityParams {
  userId: string;
  action: string;
  entityId: string;
  entityType: string;
  metadata?: any;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await supabase.from("ActivityLog").insert({
      id: crypto.randomUUID(),
      userId: params.userId,
      action: params.action,
      entityId: params.entityId,
      entityType: params.entityType,
      metadata: params.metadata || null,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function logProjectCreated(userId: string, projectId: string, projectName: string) {
  await logActivity({ userId, action: "project.created", entityId: projectId, entityType: "project", metadata: { projectName } });
}

export async function logTaskCreated(userId: string, taskId: string, projectId: string) {
  await logActivity({ userId, action: "task.created", entityId: taskId, entityType: "task", metadata: { projectId } });
}

export async function logTaskCompleted(userId: string, taskId: string) {
  await logActivity({ userId, action: "task.completed", entityId: taskId, entityType: "task" });
}
