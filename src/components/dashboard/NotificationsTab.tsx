import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
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

interface NotificationsTabProps {
  selectTab: (tab: any) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ selectTab }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-8 animate-slide-up pb-12 font-mono">
      <div className="pb-4 border-b border-zinc-150 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Site Notification Log</h2>
          <p className="text-sm mt-1 text-zinc-550">
            View real-time event alerts, automated fix success logs, and diagnostics completion statuses.
          </p>
        </div>
      </div>

      <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white">
        <div className="flex items-center gap-2 pb-4 border-b border-zinc-150 mb-5">
          <Bell className="w-5 h-5 text-violet-650" />
          <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-wider">
            All Notifications
          </h3>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-zinc-400">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-zinc-505 space-y-4">
            <Bell className="w-12 h-12 text-zinc-300 mx-auto" />
            <div className="text-sm">No notification logs recorded yet.</div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {notifications.map((n) => (
              <div key={n.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-800">{n.title}</span>
                    <span className="text-[9px] uppercase font-bold text-zinc-450 bg-zinc-100 px-2 py-0.5 rounded border">
                      {n.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-550 leading-relaxed font-sans">{n.detail}</p>
                  <div className="text-[10px] text-zinc-450 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(n.timestamp).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => selectTab(n.tabLink)}
                  type="button"
                  className="px-4 py-2 border-2 border-zinc-950 bg-white text-zinc-850 hover:bg-zinc-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] shrink-0 self-start md:self-center cursor-pointer"
                >
                  View Tab
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
export default NotificationsTab;
