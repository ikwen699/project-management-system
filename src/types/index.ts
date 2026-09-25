export type SystemRole = "USER" | "SUPER_ADMIN";

export type Plan = "starter" | "business" | "scale";
export type PlanStatus = "active" | "trialing" | "expired";
export type BillingInterval = "monthly" | "annual";

export interface Payment {
  id: string;
  userId: string;
  txRef: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  status: "pending" | "successful" | "failed";
  plan: Plan;
  planExpiresAt: Date | null;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string | null;
  role: SystemRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  isArchived: boolean;
  startDate: Date | null;
  endDate: Date | null;
  ownerId: string;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: MemberRole;
  joinedAt: Date;
}

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

export interface ProjectInvite {
  id: string;
  projectId: string;
  email: string;
  invitedById: string;
  role: MemberRole;
  token: string;
  expiresAt: Date;
  status: InviteStatus;
  createdAt: Date;
}

export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface Column {
  id: string;
  name: string;
  position: number;
  projectId: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  deadline: Date | null;
  position: number;
  columnId: string;
  projectId: string;
  teamId: string | null;
  assigneeId: string | null;
  completedAt: Date | null;
  estimatedHours: number | null;
  timeSpent: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  createdAt: Date;
}

export interface FileAttachment {
  id: string;
  taskId: string;
  userId: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  fileUrl: string;
  createdAt: Date;
}

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  projectId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  duration: number;
  projectId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  userId: string;
  senderId: string | null;
  projectId: string | null;
  createdAt: Date;
}

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "MENTION_RECEIVED"
  | "PROJECT_MEMBER_ADDED"
  | "MILESTONE_COMPLETED"
  | "PROJECT_DEADLINE_APPROACHING"
  | "ORG_INVITE";

export interface NotificationPreference {
  id: string;
  userId: string;
  emailEnabled: boolean;
  taskAssigned: boolean;
  taskStatusChanged: boolean;
  taskDueSoon: boolean;
  taskOverdue: boolean;
  mentionReceived: boolean;
  memberAdded: boolean;
  milestoneCompleted: boolean;
  projectDeadline: boolean;
  dueSoonDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityId: string;
  entityType: string;
  metadata: any;
  createdAt: Date;
}

// ──── Extended types for queries ────

export interface TaskWithAssignee extends Task {
  assigneeName?: string | null;
  assigneeAvatar?: string | null;
  teamName?: string | null;
  timeEntries?: TimeEntry[];
  attachments?: FileAttachment[];
}

export interface ColumnWithTasks extends Column {
  tasks: TaskWithAssignee[];
}

export interface ProjectWithMembers extends Project {
  members: (ProjectMember & {
    userName: string;
    userEmail: string;
    userAvatar: string | null;
  })[];
  taskCount: number;
}

export interface ProjectDetailed extends Project {
  members: (ProjectMember & {
    userName: string;
    userEmail: string;
    userAvatar: string | null;
  })[];
  columns: ColumnWithTasks[];
  taskCount: number;
  memberCount: number;
}

export interface DashboardMetrics {
  projectsWithTasks: number;
  totalProjects: number;
  taskAssignmentRate: number;
  onTimeCompletion: number;
  taskCompletionRate: number;
  projectsOnSchedule: number;
  avgCompletionTime: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "task" | "milestone" | "meeting" | "project_start" | "project_end";
  projectId: string;
  projectName: string;
  color: string;
}

// ──── Organisations, teams and members ────

export type OrgRole = "ADMIN" | "MEMBER";
export type TeamRole = "LEAD" | "MEMBER";

export interface Organization {
  id: string;
  name: string;
  type: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  description: string | null;
  createdAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  joinedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  organizationName?: string;
  teamId: string | null;
  teamName?: string | null;
  email: string;
  role: OrgRole;
  invitedById: string;
  inviterName?: string;
  token: string;
  expiresAt: Date | null;
  status: InviteStatus;
  createdAt: Date;
}

export interface TeamWithMembers extends Team {
  members: (TeamMember & {
    userName: string;
    userEmail: string;
    userAvatar: string | null;
  })[];
  memberCount: number;
}

export interface OrganizationWithDetails extends Organization {
  myRole: OrgRole | null;
  memberCount: number;
  teams: TeamWithMembers[];
  members: (OrganizationMember & {
    userName: string;
    userEmail: string;
    userAvatar: string | null;
  })[];
  pendingInvites: OrganizationInvite[];
}

export interface TeamMemberWithUser {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
}

export interface TeamListing extends Team {
  memberCount: number;
}

export interface OrgListing extends Organization {
  myRole: OrgRole | null;
  memberCount: number;
  teamCount: number;
}
