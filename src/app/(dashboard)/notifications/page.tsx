"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  TASK_ASSIGNED: "📋",
  TASK_STATUS_CHANGED: "🔄",
  TASK_DUE_SOON: "⏰",
  TASK_OVERDUE: "🚨",
  MENTION_RECEIVED: "💬",
  PROJECT_MEMBER_ADDED: "👥",
  MILESTONE_COMPLETED: "🏁",
  PROJECT_DEADLINE_APPROACHING: "📅",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  function loadNotifications() {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data))
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadNotifications(); }, []);

  async function markAsRead(id: string) {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id, isRead: true }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  async function markAllAsRead() {
    await fetch("/api/notifications/read-all", { method: "PUT" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="flex items-center gap-1 text-sm text-primary hover:underline">
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No notifications yet</p>
          <p className="text-sm mt-1">You'll be notified about important events</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors ${!notification.isRead ? "bg-primary/5" : ""}`}
            >
              <span className="text-xl mt-0.5">{typeIcons[notification.type] || "📌"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm ${!notification.isRead ? "font-semibold" : "font-medium"}`}>{notification.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                  </div>
                  {!notification.isRead && (
                    <button onClick={() => markAsRead(notification.id)} className="p-1 hover:bg-muted rounded shrink-0" aria-label="Mark as read">
                      <CheckCheck className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                {notification.link && (
                  <a href={notification.link} className="text-xs text-primary hover:underline mt-1 inline-block" onClick={() => markAsRead(notification.id)}>View project</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
