"use client";

import { User, Lock, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsTabs = [
  { href: "/settings", label: "Profile", icon: User },
  { href: "/settings/password", label: "Password", icon: Lock },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
];

const notificationOptions = [
  { key: "taskAssigned", label: "Task assigned to you" },
  { key: "taskStatusChanged", label: "Task status changed" },
  { key: "taskDueSoon", label: "Task due soon" },
  { key: "taskOverdue", label: "Task overdue" },
  { key: "mentionReceived", label: "Mention received" },
  { key: "memberAdded", label: "Project member added" },
  { key: "milestoneCompleted", label: "Milestone completed" },
  { key: "projectDeadline", label: "Project deadline approaching" },
];

export default function NotificationSettingsPage() {
  const pathname = usePathname();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {settingsTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              pathname === tab.href
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Notification Preferences
          </h2>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {notificationOptions.map((option) => (
            <div
              key={option.key}
              className="flex items-center justify-between py-2"
            >
              <p className="text-sm">{option.label}</p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Due soon warning: notify{" "}
            <select className="mx-1 border border-input rounded px-2 py-1 text-sm">
              <option value={1}>1 day</option>
              <option value={3} selected>
                3 days
              </option>
              <option value={7}>7 days</option>
            </select>{" "}
            before deadline
          </label>
        </div>

        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
