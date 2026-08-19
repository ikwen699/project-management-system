"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, X } from "lucide-react";

interface UserOption {
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string | null;
}

interface UserSelectProps {
  users: UserOption[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  showEmail?: boolean;
  disabled?: boolean;
}

export function UserSelect({
  users,
  value,
  onChange,
  placeholder = "Select user...",
  showEmail = true,
  disabled = false,
}: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = users.find((u) => u.userId === value);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.userName.toLowerCase().includes(q) ||
      (u.userEmail && u.userEmail.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle() {
    if (disabled) return;
    setOpen(!open);
    setSearch("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSelect(userId: string) {
    onChange(userId);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between border border-input rounded-lg px-3 py-2 text-sm text-left outline-none transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-ring"
        } ${open ? "ring-2 ring-ring border-ring" : ""}`}
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
              {selected.userAvatar ? (
                <img src={selected.userAvatar} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <span className="text-[10px] font-medium text-primary-foreground">
                  {selected.userName?.charAt(0) || "?"}
                </span>
              )}
            </div>
            <span className="truncate font-medium">{selected.userName}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {selected && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-muted rounded text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronUp
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              open ? "" : "rotate-180"
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full border border-input rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                No users found
              </div>
            ) : (
              filtered.map((user) => (
                <button
                  key={user.userId}
                  type="button"
                  onClick={() => handleSelect(user.userId)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${
                    user.userId === value ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="h-7 w-7 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                    {user.userAvatar ? (
                      <img src={user.userAvatar} alt="" className="h-7 w-7 rounded-full" />
                    ) : (
                      <span className="text-[11px] font-medium text-primary-foreground">
                        {user.userName?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.userName}</p>
                    {showEmail && user.userEmail && (
                      <p className="text-xs text-muted-foreground truncate">{user.userEmail}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
