import { Lightbulb, CheckCircle2, MapPin, Sparkles, ShoppingBag, Search, Brain, Lock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MatchedFoundItem {
  id: string;
  clothingType: string;
  color: string;
  description: string;
  location: string;
  imageUrl?: string;
  status: "unclaimed" | "claimed" | "resolved";
  createdAt: string;
  matchPercentage: number;
  reasoning: string | null;
}

function MatchBadge({ pct }: { pct: number }) {
  const color =
    pct >= 85 ? "bg-emerald-500" :
    pct >= 70 ? "bg-[#2962ff]" :
    "bg-amber-500";
  return (
    <span className={`inline-flex items-center gap-1.5 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg ${color}`}>
      <Brain className="w-3 h-3" />
      {pct}% Match
    </span>
  );
}

function MatchBar({ pct }: { pct: number }) {
  const color = pct >= 85 ? "bg-emerald-500" : pct >= 70 ? "bg-[#2962ff]" : "bg-amber-500";
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function FoundItems() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<MatchedFoundItem[]>({
    queryKey: ["/api/found-items"],
    queryFn: async () => {
      const res = await fetch("/api/found-items", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const claim = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/found-items/${id}/claim`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/found-items"] });
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Claim submitted!", description: "Staff will verify and contact you." });
    },
    onError: (err: Error) => {
      toast({ title: "Could not claim item", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Found Items</h2>
        <p className="text-slate-500 mt-2 text-lg">Items matched to your lost item reports by AI</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {isLoading ? (
            <div className="bg-white rounded-[2rem] p-12 text-center text-slate-400 border border-slate-100">
              Scanning for matches…
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-[#f0f4ff] rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#2962ff]" />
              </div>
              <h3 className="font-bold text-slate-700 text-lg mb-2">No matches yet</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                Found items are only shown when our AI detects a match (≥60%) with your lost item descriptions. Report a lost item first to enable matching.
              </p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={item.id} className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                {/* Match badge top-left */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <MatchBadge pct={item.matchPercentage} />
                  {idx === 0 && (
                    <span className="bg-[#0b2b8c] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      Best Match
                    </span>
                  )}
                </div>

                {/* Image */}
                <div className="w-48 h-48 bg-[#f8fafc] rounded-3xl shrink-0 p-4 border border-slate-100 flex items-center justify-center mt-8 md:mt-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.clothingType} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <ShoppingBag className="w-16 h-16 text-slate-300" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4 w-full text-center md:text-left">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{item.color} {item.clothingType}</h3>
                    {item.description && (
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed">{item.description}</p>
                    )}
                  </div>

                  {/* AI reasoning */}
                  {item.reasoning && (
                    <div className="bg-[#f0f4ff] rounded-2xl px-4 py-3 border border-[#e5edff]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Brain className="w-3.5 h-3.5 text-[#2962ff]" />
                        <span className="text-[10px] font-bold text-[#2962ff] uppercase tracking-wider">AI Reasoning</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.reasoning}</p>
                      <MatchBar pct={item.matchPercentage} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {[["Color", item.color], ["Type", item.clothingType]].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{k}</p>
                        <p className="text-sm font-semibold text-slate-700 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{item.location}</span>
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <button
                      onClick={() => claim.mutate(item.id)}
                      disabled={claim.isPending}
                      className={`text-white text-sm font-bold py-3 px-6 rounded-full flex items-center space-x-2 transition-colors ${item.matchPercentage >= 85 ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#2962ff] hover:bg-blue-700"} disabled:opacity-60`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Claim This Item</span>
                    </button>
                    <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="w-full lg:w-[340px]">
          <div className="bg-[#f8faff] rounded-3xl p-8 border border-[#e5edff] h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#2962ff] rounded-xl flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-slate-800 text-lg">AI Matching</h4>
            </div>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>Only items with at least <span className="font-bold text-[#2962ff]">60% AI match</span> to your lost item descriptions are shown here.</p>
              <p>The higher the percentage, the more likely it's your item. Claim it and staff will verify.</p>
              <div className="space-y-2">
                {[
                  { label: "High Match", pct: "≥85%", color: "bg-emerald-500" },
                  { label: "Good Match", pct: "70–84%", color: "bg-[#2962ff]" },
                  { label: "Possible Match", pct: "60–69%", color: "bg-amber-500" },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-100">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-700">{label}</p>
                      <p className="text-[10px] text-slate-400">{pct}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#f0f4ff] rounded-2xl p-4 border border-[#e5edff]">
                <p className="font-bold text-[#2962ff] text-xs uppercase tracking-wider mb-1">Tip</p>
                <p>Report your lost item with a detailed description for better AI matching.</p>
              </div>
              <div className="pt-2">
                <p className="text-xs text-slate-400 font-medium">Matched items: <span className="text-slate-600 font-bold">{items.length}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
