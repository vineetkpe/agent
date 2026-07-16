import React, { useState, useEffect, useRef } from "react";
import { Bell, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Notification {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  detail: string;
  tabLink: string;
}

interface NotificationBellProps {
  selectTab: (tab: any) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ selectTab }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/notifications", { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setLastCheck(data.lastNotificationCheckAt || null);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for ambient updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => {
    if (!lastCheck) return true;
    return new Date(n.timestamp).getTime() > new Date(lastCheck).getTime();
  }).length;

  const handleBellClick = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark as read in DB
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const res = await fetch("/api/notifications", { method: "POST", headers });
        if (res.ok) {
          const data = await res.json();
          setLastCheck(data.lastNotificationCheckAt);
        }
      } catch (err) {
        console.error("Failed to mark notifications as read", err);
      }
    }
  };

  return (
    <div className="relative font-mono" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        type="button"
        className="p-2 border-2 border-zinc-950 bg-white rounded-xl hover:bg-zinc-50 transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] active:translate-x-[1px] active:translate-y-[1px] relative flex items-center justify-center shrink-0"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 text-zinc-900" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-mono font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm animate-pulse border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto border-2 border-zinc-950 bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] z-50 animate-scale-up py-2 flex flex-col divide-y divide-zinc-150">
          <div className="px-4 py-2 flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest pb-3">
            <span>Recent Events</span>
            {unreadCount > 0 && (
              <span className="text-violet-650 bg-violet-50 border border-violet-100 rounded px-1.5 py-0.5">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 font-sans italic">
                No events recorded. Run an audit to see real-time updates!
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !lastCheck || new Date(n.timestamp).getTime() > new Date(lastCheck).getTime();
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      selectTab(n.tabLink);
                      setIsOpen(false);
                    }}
                    type="button"
                    className={`w-full p-3 text-left hover:bg-zinc-50 transition-colors flex flex-col gap-1 relative ${
                      isUnread ? "bg-violet-50/20" : ""
                    }`}
                  >
                    {isUnread && (
                      <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-violet-650" />
                    )}
                    <span className="text-[11px] font-bold text-zinc-800 pr-4">{n.title}</span>
                    <span className="text-[10px] text-zinc-500 leading-normal font-sans">{n.detail}</span>
                    <span className="text-[9px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationBell;
