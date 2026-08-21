"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Bell,
  Settings,
  Archive,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/projects/archived", label: "Archived", icon: Archive },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminItem = { href: "/admin", label: "Admin", icon: Shield };

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = (session?.user as any)?.role === "SUPER_ADMIN";
  const allItems = isAdmin ? [...navItems, adminItem] : navItems;

  return (
    <aside
      className={`hidden md:flex flex-col bg-sidebar-bg text-sidebar-fg transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div
        className={`flex items-center h-16 px-4 border-b border-sidebar-border ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <img src="/logo.png" alt="Logo" width={32} height={32} className="rounded" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {allItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-fg/70 hover:bg-sidebar-accent hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
