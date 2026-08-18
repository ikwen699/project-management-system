"use client";

import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications/unread-count")
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Toggle menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-64">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search..." className="bg-transparent text-sm w-full outline-none placeholder:text-muted-foreground" aria-label="Search" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="User menu" aria-expanded={showUserMenu}>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground">{userInitial}</span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border py-1 z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email || ""}</p>
              </div>
              <Link href="/settings" className="block px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setShowUserMenu(false)}>Profile Settings</Link>
              <Link href="/settings/notifications" className="block px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setShowUserMenu(false)}>Notification Preferences</Link>
              <hr className="my-1 border-border" />
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors">Log out</button>
            </div>
          )}
        </div>
      </div>

      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-sidebar-bg text-sidebar-fg p-4">
            <p className="text-lg font-bold mb-4">PMS</p>
            <nav className="space-y-1">
              <a href="/" className="block px-3 py-2 rounded-lg hover:bg-sidebar-accent" onClick={() => setShowMobileMenu(false)}>Dashboard</a>
              <a href="/projects" className="block px-3 py-2 rounded-lg hover:bg-sidebar-accent" onClick={() => setShowMobileMenu(false)}>Projects</a>
              <a href="/calendar" className="block px-3 py-2 rounded-lg hover:bg-sidebar-accent" onClick={() => setShowMobileMenu(false)}>Calendar</a>
              <a href="/notifications" className="block px-3 py-2 rounded-lg hover:bg-sidebar-accent" onClick={() => setShowMobileMenu(false)}>Notifications</a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
