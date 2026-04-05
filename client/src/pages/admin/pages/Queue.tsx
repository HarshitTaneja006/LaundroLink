import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

type Workflow = {
  user_id: string;
  username: string;
  display_name: string;
  status: string;
  bag_id: string | null;
  updated_at: string;
};

const statusConfig: Record<string, { label: string; cls: string; icon: string }> = {
  dropped:          { label: "Dropped",        cls: "bg-red-100 text-red-600",      icon: "●" },
  washing:          { label: "Washing",        cls: "bg-orange-50 text-orange-500", icon: "⟳" },
  drying:           { label: "Drying",         cls: "bg-yellow-50 text-yellow-600", icon: "◌" },
  ready:            { label: "Ready",          cls: "bg-green-50 text-green-600",   icon: "✓" },
  ready_for_pickup: { label: "Ready for Pickup", cls: "bg-green-50 text-green-600", icon: "✓" },
  delivered:        { label: "Delivered",      cls: "bg-blue-50 text-blue-600",     icon: "📦" },
};

const statBorderColor: Record<string, string> = {
  Total: "bg-gray-200", Washing: "bg-orange-500", Ready: "bg-amber-400", Delivered: "bg-green-500",
};

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-[10px] px-5 py-4 relative overflow-hidden">
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${statBorderColor[label] || "bg-gray-200"}`} />
      <div className={`text-[10px] font-semibold tracking-widest uppercase mb-2.5 ${color}`}>{label}</div>
      <div className="text-[32px] font-bold tracking-tight">{value}</div>
      <div className="absolute right-4 top-4 w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-lg">{icon}</div>
    </div>
  );
}

export default function QueuePage() {
  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/admin/workflows"],
    refetchInterval: 8000,
  });

  const totalCount = workflows.length;
  const washingCount = workflows.filter(w => w.status === "washing").length;
  const readyCount = workflows.filter(w => w.status === "ready" || w.status === "ready_for_pickup").length;
  const deliveredCount = workflows.filter(w => w.status === "delivered").length;

  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="p-7 overflow-y-auto flex-1">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">Live Queue Monitor</h2>
          <p className="text-gray-500 text-[13px] mt-1">Real-time oversight of current facility operations and student laundry states.</p>
        </div>
        <span className="text-[13px] font-semibold text-gray-400">{today}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <StatCard label="Total"    value={totalCount}    icon="📋" color="text-gray-400" />
        <StatCard label="Washing"  value={washingCount}  icon="🔄" color="text-orange-500" />
        <StatCard label="Ready"    value={readyCount}    icon="✅" color="text-amber-500" />
        <StatCard label="Delivered" value={deliveredCount} icon="🚚" color="text-green-500" />
      </div>

      <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 font-semibold text-[14px]">
            <div className="w-2 h-2 rounded-full bg-[#1e6cff] animate-pulse" />
            Active Orders
          </div>
          <div className="flex gap-2">
            <span className="text-[12px] text-gray-400 self-center">Auto-refreshes every 8s</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-[13px]">Loading workflows…</div>
          ) : workflows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-[13px]">No active laundry workflows found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {["Status", "Student", "Time in Status", "Username", "Last Updated"].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold tracking-wide uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workflows.map((w) => {
                  const cfg = statusConfig[w.status] || { label: w.status, cls: "bg-gray-100 text-gray-500", icon: "●" };
                  const elapsed = formatDistanceToNow(new Date(w.updated_at), { addSuffix: false });
                  return (
                    <tr key={w.user_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors" data-testid={`row-workflow-${w.user_id}`}>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[13px]">{w.display_name || w.username}</div>
                        <div className="text-[12px] text-gray-400 font-mono">{w.username}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[13px] font-medium text-gray-600">{elapsed}</td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-gray-600 font-semibold">{w.username}</td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-400">{new Date(w.updated_at).toLocaleTimeString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && workflows.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-[12px] text-gray-400">
            Showing {workflows.length} active order{workflows.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
