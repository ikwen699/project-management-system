import { supabase } from "./supabase";

type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "MENTION_RECEIVED"
  | "PROJECT_MEMBER_ADDED"
  | "MILESTONE_COMPLETED"
  | "PROJECT_DEADLINE_APPROACHING";

interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  userId: string;
  senderId?: string;
  projectId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await supabase.from("Notification").insert({
      id: crypto.randomUUID(),
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      userId: params.userId,
      senderId: params.senderId || null,
      projectId: params.projectId || null,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function notifyTaskAssigned(
  assigneeId: string,
  senderId: string,
  taskTitle: string,
  projectId: string
) {
  if (assigneeId === senderId) return;
  await createNotification({
    type: "TASK_ASSIGNED",
    title: "Task assigned to you",
    message: `You have been assigned to "${taskTitle}"`,
    link: `/projects/${projectId}`,
    userId: assigneeId,
    senderId,
    projectId,
  });
}

export async function notifyTaskStatusChanged(
  projectId: string,
  taskTitle: string,
  newColumn: string,
  assigneeId: string | null,
  senderId: string
) {
  if (!assigneeId || assigneeId === senderId) return;
  await createNotification({
    type: "TASK_STATUS_CHANGED",
    title: "Task status changed",
    message: `"${taskTitle}" moved to ${newColumn}`,
    link: `/projects/${projectId}`,
    userId: assigneeId,
    senderId,
    projectId,
  });
}

export async function notifyMemberAdded(
  projectId: string,
  projectName: string,
  newMemberId: string,
  senderId: string
) {
  await createNotification({
    type: "PROJECT_MEMBER_ADDED",
    title: "Added to project",
    message: `You have been added to "${projectName}"`,
    link: `/projects/${projectId}`,
    userId: newMemberId,
    senderId,
    projectId,
  });
}
