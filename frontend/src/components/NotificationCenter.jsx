import { useState, useRef, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  Zap,
  XCircle,
  Trophy,
  Hourglass,
  Check,
  Trash2,
  X
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../hooks/useAuth";

export default function NotificationCenter() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const getNotifIcon = (type) => {
    switch (type) {
      case "CONFIRMATION":
        return <CheckCircle2 className="h-4 w-4 text-available" />;
      case "PROMOTION":
        return <Zap className="h-4 w-4 text-accent" />;
      case "CANCELLATION":
        return <XCircle className="h-4 w-4 text-booked" />;
      case "EVENT_APPROVAL":
        return <Trophy className="h-4 w-4 text-accent" />;
      case "WAITLIST":
        return <Hourglass className="h-4 w-4 text-accent" />;
      default:
        return <Bell className="h-4 w-4 text-muted" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-surface text-muted hover:text-white hover:border-surface-border/80 transition"
        title="Notification Center"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-extrabold text-accent-foreground shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-surface-border bg-surface shadow-2xl z-50 overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between border-b border-surface-border p-4 bg-surface-hover/40">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" />
              <h3 className="font-display text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[10px] font-extrabold text-accent">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={() => clearAll()}
                  className="flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-booked transition"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-muted hover:text-white hover:bg-surface-border transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border/50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                No notifications right now. Booking updates and waitlist alerts will appear here!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`flex items-start justify-between p-4 gap-3 transition cursor-pointer ${
                    !n.isRead ? "bg-accent/5 hover:bg-accent/10" : "hover:bg-surface-hover/40 opacity-75"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{getNotifIcon(n.type)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white block">{n.title}</span>
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                        {n.message}
                      </p>
                      <span className="mt-1 text-[10px] text-muted/60 font-mono block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(n.id);
                      }}
                      className="shrink-0 text-muted hover:text-accent transition p-1"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
