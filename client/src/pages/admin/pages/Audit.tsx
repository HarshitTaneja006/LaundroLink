import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";

type Workflow = {
  user_id: string;
  username: string;
  display_name: string;
  status: string;
  bag_id: string | null;
  updated_at: string;
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  dropped:          { label: "Dropped",          cls: "bg-red-100 text-red-600" },
  washing:          { label: "Washing",          cls: "bg-orange-50 text-orange-500" },
  ready:            { label: "Ready",            cls: "bg-green-50 text-green-600" },
  ready_for_pickup: { label: "Ready for Pickup", cls: "bg-green-50 text-green-600" },
  delivered:        { label: "Delivered",        cls: "bg-blue-50 text-blue-600" },
};

const steps = ["dropped", "washing", "ready_for_pickup", "delivered"];
const stepIcons: Record<string, string> = {
  dropped: "📥", washing: "🔄", ready_for_pickup: "✅", delivered: "📦",
};
const stepDesc: Record<string, string> = {
  dropped: "Student dropped off laundry bag at the facility.",
  washing: "Laundry loaded into washing machine.",
  ready_for_pickup: "Laundry is ready for pickup.",
  delivered: "Laundry collected by student.",
};

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("any");
  const [selected, setSelected] = useState<Workflow | null>(null);

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/admin/workflows"],
    refetchInterval: 15000,
  });

  const filtered = workflows.filter(w => {
    const q = search.toLowerCase();
    const matchQ = !q || w.username.toLowerCase().includes(q) || (w.display_name || "").toLowerCase().includes(q) || (w.bag_id || "").toLowerCase().includes(q);
    const matchS = statusFilter === "any" || w.status === statusFilter;
    return matchQ && matchS;
  });

  const sel = selected || filtered[0] || null;
  const currentStepIdx = sel ? steps.indexOf(sel.status) : -1;

  return (
    <div className="p-7 overflow-y-auto flex-1">
      <div className="mb-6">
        <h2 className="text-[22px] font-bold tracking-tight">Cycle Audit</h2>
        <p className="text-gray-500 text-[13px] mt-1">Search and audit individual laundry cycle events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
        <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-[15px] font-bold mb-4">Cycle Search</h3>
            <div className="mb-3">
              <label className="block text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-1.5">Identity Filter</label>
              <input
                className="w-full px-2.5 py-2 border border-gray-200 rounded-md text-[13px] bg-white text-gray-900 outline-none focus:border-blue-500 transition-colors"
                type="text"
                placeholder="Bag ID, username, or name"
                value={search}
                onChange={e => setSearch(e.target.value)}
                data-testid="audit-search"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-1.5">Status</label>
              <select
                className="w-full px-2.5 py-2 border border-gray-200 rounded-md text-[13px] bg-white text-gray-900 outline-none focus:border-blue-500 transition-colors"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                data-testid="audit-status-filter"
              >
                <option value="any">Any Status</option>
                {steps.map(s => (
                  <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            {isLoading && <div className="p-4 text-center text-gray-400 text-[13px]">Loading…</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="p-4 text-center text-gray-400 text-[13px]">No results found.</div>
            )}
            {filtered.map((w) => {
              const cfg = statusConfig[w.status] || { label: w.status, cls: "bg-gray-100 text-gray-500" };
              const isSelected = sel?.user_id === w.user_id;
              return (
                <div
                  key={w.user_id}
                  onClick={() => setSelected(w)}
                  className={`px-4 py-3.5 border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-gray-50"}`}
                  data-testid={`audit-item-${w.user_id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-semibold text-[13px]">{w.bag_id || "No bag"}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                  <div className="text-[12px] text-gray-400">{w.display_name || w.username}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    🕐 {formatDistanceToNow(new Date(w.updated_at), { addSuffix: true })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden">
          {sel ? (
            <>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <div className="text-[11px] font-bold tracking-widest uppercase text-blue-600">Audit Trail</div>
                  <div className="text-[17px] font-bold mt-1">
                    {sel.display_name || sel.username} · {format(new Date(sel.updated_at), "MMM d, yyyy")}
                    {sel.bag_id && (
                      <> / Bag:{" "}
                        <span className="text-blue-600 font-mono">{sel.bag_id}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-0">
                {steps.map((step, i) => {
                  const completed = i <= currentStepIdx;
                  const isActive = i === currentStepIdx;
                  return (
                    <div key={step} className="flex gap-3.5 relative">
                      {i < steps.length - 1 && (
                        <div
                          className="absolute left-[10px] top-6 bottom-0 w-px"
                          style={{ background: completed ? "#1e6cff30" : "#e5e7eb" }}
                        />
                      )}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-[10px] font-bold z-10"
                        style={{
                          background: isActive ? "#1e6cff" : completed ? "#dbeafe" : "#f3f4f6",
                          color: isActive ? "#fff" : completed ? "#1e6cff" : "#9ca3af",
                        }}
                      >
                        {completed ? "✓" : i + 1}
                      </div>
                      <div className={`pb-6 ${i === steps.length - 1 ? "pb-2" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px]">{stepIcons[step]}</span>
                          <div className={`text-[13px] font-semibold ${completed ? "text-gray-900" : "text-gray-400"}`}>
                            {statusConfig[step]?.label || step}
                          </div>
                          {isActive && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">CURRENT</span>
                          )}
                        </div>
                        <div className="text-[12px] text-gray-400 mt-0.5">{stepDesc[step]}</div>
                        {isActive && (
                          <div className="text-[11px] text-blue-500 mt-0.5">
                            Updated {formatDistanceToNow(new Date(sel.updated_at), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-400 text-[13px]">
              Select a cycle from the list to view its audit trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
