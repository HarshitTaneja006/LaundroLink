import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

type LostItem = {
  id: string;
  description: string;
  location?: string | null;
  status: string;
  image_url?: string | null;
  created_at: string;
  user_id: string;
};

type FoundItem = {
  id: string;
  description: string;
  location?: string | null;
  status: string;
  image_url?: string | null;
  created_at: string;
};

const lostStatusCls: Record<string, string> = {
  searching: "bg-red-100 text-red-600",
  matched:   "bg-blue-50 text-blue-600",
  claimed:   "bg-green-50 text-green-700",
};

const foundStatusCls: Record<string, string> = {
  unclaimed:  "bg-orange-50 text-orange-500",
  matched:    "bg-blue-50 text-blue-600",
  claimed:    "bg-green-50 text-green-700",
  discarded:  "bg-gray-100 text-gray-500",
};

type Tab = "lost" | "found";

export default function LostFoundPage() {
  const [tab, setTab] = useState<Tab>("lost");
  const [search, setSearch] = useState("");

  const { data: lostItems = [], isLoading: loadingLost } = useQuery<LostItem[]>({
    queryKey: ["/api/admin/lost-items"],
    refetchInterval: 20000,
  });

  const { data: foundItems = [], isLoading: loadingFound } = useQuery<FoundItem[]>({
    queryKey: ["/api/admin/found-items"],
    refetchInterval: 20000,
  });

  const isLoading = tab === "lost" ? loadingLost : loadingFound;
  const items = tab === "lost"
    ? lostItems.filter(i => i.description.toLowerCase().includes(search.toLowerCase()))
    : foundItems.filter(i => i.description.toLowerCase().includes(search.toLowerCase()));

  const statusCls = tab === "lost" ? lostStatusCls : foundStatusCls;

  return (
    <div className="p-7 overflow-y-auto flex-1">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">Lost & Found</h2>
          <p className="text-gray-500 text-[13px] mt-1">Manage lost and found item reports from students.</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[12px] text-gray-400 self-center">
            {lostItems.length} lost · {foundItems.length} found
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
        {[
          { label: "Reported Lost", value: lostItems.length, icon: "🔍", color: "text-red-500", border: "bg-red-500" },
          { label: "Found Items", value: foundItems.length, icon: "📦", color: "text-blue-500", border: "bg-blue-500" },
          { label: "Matched", value: foundItems.filter(i => i.status === "matched" || i.status === "claimed").length, icon: "✅", color: "text-green-500", border: "bg-green-500" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-[10px] px-5 py-4 relative overflow-hidden">
            <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${s.border}`} />
            <div className={`text-[10px] font-semibold tracking-widest uppercase mb-2.5 ${s.color}`}>{s.label}</div>
            <div className="text-[32px] font-bold tracking-tight">{s.value}</div>
            <div className="absolute right-4 top-4 w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-lg">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex gap-1">
            {(["lost", "found"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                data-testid={`tab-${t}`}
                className="px-4 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
                style={{
                  background: tab === t ? "#0f1420" : "transparent",
                  color: tab === t ? "#fff" : "#6b7280",
                }}
              >
                {t === "lost" ? "Lost Reports" : "Found Items"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 max-w-xs">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-[13px] text-gray-700 placeholder-gray-400"
              data-testid="lf-search"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-[13px]">Loading items…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-[13px]">No {tab} items found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {["#", "Description", "Location", "Status", "Reported", "Photo"].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold tracking-wide uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const cfg = statusCls[item.status] || "bg-gray-100 text-gray-500";
                  return (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors" data-testid={`row-lf-${item.id}`}>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3.5 text-[13px] font-medium max-w-[200px]">{item.description}</td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-400">{item.location || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-400">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-5 py-3.5">
                        {item.image_url ? (
                          <a href={item.image_url} target="_blank" rel="noreferrer">
                            <img src={item.image_url} alt="item" className="w-8 h-8 rounded object-cover border border-gray-200" />
                          </a>
                        ) : (
                          <span className="text-gray-300 text-[12px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!isLoading && items.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-[12px] text-gray-400">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
