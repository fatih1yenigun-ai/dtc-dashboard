"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Az once";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk once`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat once`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gun once`;
  return date.toLocaleDateString("tr-TR");
}

export default function NotificationBell() {
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silent
    }
  }, [token]);

  // Fetch unread count on mount and every 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function fetchNotifications() {
    if (!token) return;
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silent
    } finally {
      setLoadingNotifs(false);
    }
  }

  function toggleOpen() {
    if (!open) {
      fetchNotifications();
    }
    setOpen(!open);
  }

  async function handleMarkRead(id: number) {
    if (!token) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "mark_read", id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }

  async function handleMarkAllRead() {
    if (!token) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleOpen}
        className="relative text-text-muted hover:text-text-secondary transition-colors"
        title="Bildirimler"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center leading-none px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] bg-bg-card border border-border-default rounded-[14px] shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <span className="text-sm font-semibold text-text-primary">
              Bildirimler
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-accent hover:underline"
              >
                Tumunu Okundu Isaretle
              </button>
            )}
          </div>

          {/* Notification list */}
          {loadingNotifs ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-muted">
              Bildirim yok
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) handleMarkRead(notif.id);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-border-default last:border-b-0 hover:bg-bg-hover transition-colors ${
                    !notif.read ? "border-l-2 border-l-accent bg-accent/5" : ""
                  }`}
                >
                  <p
                    className={`text-sm ${
                      !notif.read
                        ? "font-semibold text-text-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                      {notif.body}
                    </p>
                  )}
                  <p className="text-[11px] text-text-muted mt-1">
                    {timeAgo(notif.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
