import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  user_id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
};

const typeCls: Record<string, string> = {
  status_update: "bg-blue-50 text-blue-600",
  match_found:   "bg-purple-50 text-purple-600",
  reminder:      "bg-orange-50 text-orange-500",
  alert:         "bg-red-100 text-red-600",
};

const composeSuggestions = [
  { label: "Ready for Pickup", msg: "Your laundry is ready for pickup. Please collect it within 24 hours." },
  { label: "Reminder", msg: "Reminder: Your laundry has been in the facility for over 24 hours." },
  { label: "Lost Item Match", msg: "Good news! We may have found an item matching your lost report." },
];

export default function CommsPage() {
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("status_update");

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/admin/notifications"],
    refetchInterval: 15000,
  });

  const typeLabel: Record<string, string> = {
    status_update: "Status Update",
    match_found: "Match Found",
    reminder: "Reminder",
    alert: "Alert",
  };

  return (
    <div className="p-7 overflow-y-auto flex-1">
      <div className="mb-6">
        <h2 className="text-[22px] font-bold tracking-tight">Communications</h2>
        <p className="text-gray-500 text-[13px] mt-1">Manage student notifications and communication history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-[13px] font-bold uppercase tracking-wide">Notification History</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">All system notifications sent to students</p>
              </div>
              <span className="text-[12px] text-gray-400 font-mono">{notifications.length} total</span>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-400 text-[13px]">Loading notifications…</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-[13px]">No notifications sent yet.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      {["Type", "Message", "Sent", "Read"].map(h => (
                        <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold tracking-wide uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.slice(0, 30).map((n) => {
                      const cls = typeCls[n.type] || "bg-gray-100 text-gray-500";
                      return (
                        <tr key={n.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors" data-testid={`row-notif-${n.id}`}>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
                              {typeLabel[n.type] || n.type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-[12px] text-gray-600 max-w-[280px] truncate">{n.message}</td>
                          <td className="px-5 py-3.5 text-[12px] text-gray-400">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</td>
                          <td className="px-5 py-3.5">
                            {n.read
                              ? <span className="text-[11px] font-semibold text-green-600">✓ Read</span>
                              : <span className="text-[11px] font-semibold text-gray-400">Unread</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[10px] p-5" style={{ background: "#0f1420" }}>
            <div className="text-[13px] font-bold text-white mb-4">Broadcast Message</div>
            <div className="mb-3">
              <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: "#9aa3b2" }}>Type</label>
              <select
                value={msgType}
                onChange={e => setMsgType(e.target.value)}
                className="w-full px-2.5 py-2 rounded-md text-[13px] text-white outline-none focus:border-blue-500 transition-colors"
                style={{ background: "#1a2133", border: "1px solid #2a3347" }}
                data-testid="comms-type"
              >
                {Object.entries(typeLabel).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: "#9aa3b2" }}>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="w-full px-2.5 py-2 rounded-md text-[13px] text-white outline-none resize-none focus:border-blue-500 transition-colors"
                style={{ background: "#1a2133", border: "1px solid #2a3347" }}
                placeholder="Enter message…"
                data-testid="comms-message"
              />
            </div>
            <div className="mb-4">
              <div className="text-[11px] font-semibold tracking-wide uppercase mb-2" style={{ color: "#9aa3b2" }}>Quick Templates</div>
              <div className="space-y-1.5">
                {composeSuggestions.map(s => (
                  <button
                    key={s.label}
                    onClick={() => setMessage(s.msg)}
                    className="w-full text-left px-3 py-2 rounded-md text-[12px] transition-colors"
                    style={{ background: "#1a2133", color: "#9aa3b2", border: "1px solid #2a3347" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9aa3b2"; }}
                    data-testid={`template-${s.label}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="w-full py-2 rounded-md text-[13px] font-semibold text-white transition-colors"
              style={{ background: message.trim() ? "#1e6cff" : "#2a3347", cursor: message.trim() ? "pointer" : "not-allowed" }}
              disabled={!message.trim()}
              data-testid="comms-send"
            >
              Send Broadcast
            </button>
            <p className="text-[10px] mt-2 text-center" style={{ color: "#6b7280" }}>
              Broadcast sends a notification to all active students
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-[10px] p-5">
            <div className="text-[13px] font-bold mb-3">Stats</div>
            {[
              { label: "Total Sent", value: notifications.length },
              { label: "Read", value: notifications.filter(n => n.read).length },
              { label: "Unread", value: notifications.filter(n => !n.read).length },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-[13px] text-gray-600">{s.label}</span>
                <span className="text-[14px] font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
