import { Network, CalendarDays, Bell, ChevronDown, Info, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LostItem {
  id: string;
  clothingType: string;
  color: string;
  description: string;
  status: "searching" | "matched" | "resolved";
  createdAt: string;
}

export default function LostItem() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");

  const { data: myReports = [] } = useQuery<LostItem[]>({
    queryKey: ["/api/lost-items"],
    queryFn: async () => {
      const res = await fetch("/api/lost-items", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const reportLost = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/lost-items", {
        clothingType: type,
        color,
        description,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/lost-items"] });
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Lost item reported!", description: "We'll notify you if a match is found." });
      setType(""); setColor(""); setDescription("");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to report", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !color || !description) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    reportLost.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Lost Item</h2>
        <p className="text-slate-500 mt-3 text-lg leading-relaxed">Describe the clothing item you lost so the system can match it with items uploaded by staff.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clothing Type</label>
                  <div className="relative">
                    <select value={type} onChange={(e) => setType(e.target.value)}
                      className="w-full bg-[#f8fafc] text-slate-700 text-sm font-medium rounded-2xl px-5 py-4 appearance-none border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2962ff]/20">
                      <option value="">Select type</option>
                      <option>T-Shirt</option><option>Hoodie</option><option>Jeans</option>
                      <option>Jacket</option><option>Dress</option><option>Shorts</option><option>Other</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Color</label>
                  <div className="relative">
                    <select value={color} onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-[#f8fafc] text-slate-700 text-sm font-medium rounded-2xl px-5 py-4 appearance-none border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2962ff]/20">
                      <option value="">Select color</option>
                      <option>Black</option><option>White</option><option>Grey</option>
                      <option>Blue</option><option>Red</option><option>Green</option><option>Other</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Example: Black hoodie with white logo on front"
                  className="w-full bg-[#f8fafc] text-slate-700 text-sm font-medium rounded-2xl p-5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2962ff]/20 resize-none" />
                <div className="flex items-start space-x-2 mt-2 pl-1">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-500 font-medium">Add any identifying details like brand, logo, size, or marks.</p>
                </div>
              </div>

              <div className="bg-[#f0f4ff] rounded-2xl p-5 border border-[#e5edff] flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
                  <CalendarDays className="w-6 h-6 text-[#2962ff]" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#2962ff]">Last Seen / Laundry Day</h5>
                  <p className="text-xs text-[#2962ff]/70 font-medium mt-0.5">Your last submitted laundry cycle will be considered for matching.</p>
                </div>
              </div>

              <button type="submit" disabled={reportLost.isPending}
                className="bg-[#111828] hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-bold py-4 px-8 rounded-full flex items-center space-x-2 transition-colors group shadow-lg shadow-slate-900/20">
                <span>{reportLost.isPending ? "Submitting…" : "Report Lost Item"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          {myReports.length > 0 && (
            <div className="mt-6 bg-white rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4">Your Reports</h4>
              <div className="space-y-3">
                {myReports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{r.color} {r.clothingType}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      r.status === "matched" ? "bg-emerald-100 text-emerald-700" :
                      r.status === "resolved" ? "bg-slate-100 text-slate-500" :
                      "bg-[#f0f4ff] text-[#2962ff]"
                    }`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[340px]">
          <div className="bg-[#111828] rounded-[2rem] p-10 shadow-xl text-white relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#2962ff]/20 to-transparent rounded-bl-[100px]" />
            <div className="flex justify-between items-start mb-12 relative z-10">
              <Network className="w-8 h-8 text-[#2962ff]" />
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
                <span className="text-sm font-bold tracking-wider">MATCHING</span>
              </div>
            </div>
            <div className="relative z-10 flex-1">
              <h4 className="font-bold text-2xl mb-4 tracking-tight">How matching works</h4>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Your description will be matched with clothing items uploaded by laundry staff. If a match is found, it will appear in the Found Items section.
              </p>
            </div>
            <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6 relative z-10 flex items-start space-x-4 backdrop-blur-sm">
              <Bell className="w-6 h-6 text-[#2962ff] shrink-0" />
              <p className="text-xs text-slate-300 leading-relaxed font-medium mt-0.5">
                You will receive a notification when a possible match is detected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
