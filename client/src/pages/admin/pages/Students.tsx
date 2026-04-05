import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

type Student = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  created_at: string;
  workflow_status: string | null;
  bag_id: string | null;
  workflow_updated_at: string | null;
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  dropped:          { label: "Dropped",          cls: "bg-red-100 text-red-600" },
  washing:          { label: "Washing",          cls: "bg-orange-50 text-orange-500" },
  drying:           { label: "Drying",           cls: "bg-yellow-50 text-yellow-600" },
  ready:            { label: "Ready",            cls: "bg-green-50 text-green-600" },
  ready_for_pickup: { label: "Ready for Pickup", cls: "bg-green-50 text-green-600" },
  delivered:        { label: "Delivered",        cls: "bg-blue-50 text-blue-600" },
};

const gradients = [
  "from-blue-500 to-purple-600",
  "from-pink-500 to-purple-500",
  "from-emerald-500 to-blue-500",
  "from-orange-400 to-red-500",
  "from-teal-500 to-cyan-400",
  "from-violet-500 to-pink-500",
];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function getGradient(id: string) {
  let hash = 0;
  for (const c of id) hash = ((hash << 5) - hash) + c.charCodeAt(0);
  return gradients[Math.abs(hash) % gradients.length];
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: students = [], isLoading, error } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
    refetchInterval: 15000,
  });

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.display_name || "").toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  });

  const sel = students.find(s => s.id === selected) || students[0] || null;

  return (
    <div className="p-7 overflow-y-auto flex-1">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[22px] font-bold tracking-tight">Student Management</h2>
            <span className="text-[12px] text-gray-400 font-mono">{students.length} students</span>
          </div>

          <div className="mb-4 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-white max-w-xs">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="bg-transparent outline-none text-[13px] text-gray-700 placeholder-gray-400 flex-1"
              data-testid="student-search"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-[13px]">Loading students…</div>
            ) : error ? (
              <div className="p-8 text-center text-red-600 text-[13px]">Error loading students: {(error as Error).message}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-[13px]">No students found.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {["", "Name", "Username", "Status", "Bag ID", "Since"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold tracking-wide uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const cfg = s.workflow_status ? (statusConfig[s.workflow_status] || { label: s.workflow_status, cls: "bg-gray-100 text-gray-500" }) : null;
                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelected(s.id)}
                        className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors hover:bg-gray-50/70 ${selected === s.id ? "bg-blue-50" : ""}`}
                        data-testid={`row-student-${s.id}`}
                      >
                        <td className="px-4 py-3.5">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradient(s.id)} flex items-center justify-center text-white text-[11px] font-bold`}>
                            {getInitials(s.display_name || s.username)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[13px]">{s.display_name || "—"}</td>
                        <td className="px-4 py-3.5 font-mono text-[12px] text-gray-400">{s.username}</td>
                        <td className="px-4 py-3.5">
                          {cfg ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          ) : (
                            <span className="text-[12px] text-gray-300">No order</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[12px] text-gray-400">{s.bag_id || "—"}</td>
                        <td className="px-4 py-3.5 text-[12px] text-gray-400">
                          {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {sel && (
          <div className="rounded-[10px] p-5 flex-shrink-0" style={{ background: "#0f1420", color: "#fff" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradient(sel.id)} flex items-center justify-center text-white text-[14px] font-bold`}>
                {getInitials(sel.display_name || sel.username)}
              </div>
              <div>
                <div className="text-[15px] font-bold">{sel.display_name || sel.username}</div>
                <div className="text-[12px] font-mono" style={{ color: "#9aa3b2" }}>{sel.username}</div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {[
                { label: "Email", value: sel.email || "—", icon: "✉" },
                { label: "Current Status", value: sel.workflow_status ? (statusConfig[sel.workflow_status]?.label || sel.workflow_status) : "No active order", icon: "📋" },
                { label: "Bag ID", value: sel.bag_id || "—", icon: "🏷" },
                { label: "Last Activity", value: sel.workflow_updated_at ? formatDistanceToNow(new Date(sel.workflow_updated_at), { addSuffix: true }) : "Never", icon: "🕐" },
                { label: "Joined", value: formatDistanceToNow(new Date(sel.created_at), { addSuffix: true }), icon: "📅" },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: "1px solid #2a3347" }}>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0" style={{ background: "#1a2133" }}>
                    {r.icon}
                  </div>
                  <div>
                    <div className="text-[11px]" style={{ color: "#9aa3b2" }}>{r.label}</div>
                    <div className="text-[13px] font-medium text-white">{r.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] font-bold uppercase tracking-widest mt-4 mb-1" style={{ color: "#9aa3b2" }}>
              Student ID
            </div>
            <div className="text-[11px] font-mono break-all" style={{ color: "#6b7280" }}>{sel.id}</div>
          </div>
        )}
      </div>
    </div>
  );
}
