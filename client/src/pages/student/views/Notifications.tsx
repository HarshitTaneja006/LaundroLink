import { Bell, CheckCircle2, AlertCircle, Info, Package } from "lucide-react";
import { clsx } from "clsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "match";
  read: boolean;
  createdAt: string;
}

const typeConfig = {
  info:    { icon: Package,       color: "text-[#2962ff]",  bg: "bg-[#f0f4ff]" },
  success: { icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50" },
  warning: { icon: Bell,          color: "text-amber-500",   bg: "bg-amber-50" },
  match:   { icon: AlertCircle,   color: "text-[#2962ff]",   bg: "bg-[#f0f4ff]" },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function Notifications() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Notifications</h2>
          <p className="text-slate-500 mt-2">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-sm font-semibold text-[#2962ff] hover:text-blue-800 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 text-lg mb-2">No notifications yet</h3>
            <p className="text-slate-400 text-sm">Laundry updates and alerts will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const cfg = typeConfig[n.type] || typeConfig.info;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead.mutate(n.id)}
                className={clsx(
                  "bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.07)] border flex items-start space-x-5 transition-all",
                  !n.read ? "border-[#2962ff]/20 cursor-pointer hover:shadow-md" : "border-slate-100"
                )}
              >
                <div className={clsx("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0", cfg.bg)}>
                  <Icon className={clsx("w-5 h-5", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className={clsx("font-bold text-sm", !n.read ? "text-slate-800" : "text-slate-600")}>{n.title}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-[#2962ff] shrink-0" />}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
