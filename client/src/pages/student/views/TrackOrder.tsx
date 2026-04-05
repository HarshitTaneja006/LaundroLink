import { Droplet, Clock, CheckCircle2, Wind, Bell, QrCode, LogIn, Waves, CheckCircle, Truck, RefreshCw, Timer } from "lucide-react";
import { clsx } from "clsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type WorkflowStatus = "hand_in" | "washing" | "ready_for_pickup" | "delivered";

interface Workflow {
  status: WorkflowStatus;
  bagId: string | null;
  updatedAt: string;
}

interface Machine {
  id: string;
  name: string;
  type: "washer" | "dryer";
  location: string;
  status: "available" | "in_use" | "maintenance";
  cycleTimeMinutes: number;
}
interface Session {
  id: string;
  machineId: string;
  status: "active" | "completed" | "cancelled";
  startedAt: string;
  endsAt: string | null;
}

const workflowSteps: { id: WorkflowStatus; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "hand_in",          label: "Hand In",          desc: "Bag tagged and handed in at the collection point", icon: LogIn },
  { id: "washing",          label: "Washing",           desc: "Your clothes are being washed", icon: Waves },
  { id: "ready_for_pickup", label: "Ready for Pickup",  desc: "Items folded and ready at the collection point", icon: CheckCircle },
  { id: "delivered",        label: "Delivered",         desc: "Your laundry has been delivered", icon: Truck },
];

const stepOrder: WorkflowStatus[] = ["hand_in", "washing", "ready_for_pickup", "delivered"];

function getStepState(stepId: WorkflowStatus, current: WorkflowStatus) {
  const ci = stepOrder.indexOf(current);
  const si = stepOrder.indexOf(stepId);
  if (si < ci) return "completed";
  if (si === ci) return "active";
  return "pending";
}

function progressPercent(status: WorkflowStatus) {
  const idx = stepOrder.indexOf(status);
  return Math.round((idx / (stepOrder.length - 1)) * 100);
}

function statusLabel(s: WorkflowStatus) {
  return { hand_in: "Handed In", washing: "Being Washed", ready_for_pickup: "Ready for Pickup!", delivered: "Delivered" }[s];
}

// Base minutes per status before the bag reaches ready-for-pickup
const BASE_ETA_MINUTES: Partial<Record<WorkflowStatus, number>> = {
  hand_in: 60,   // ~45 min wash + 15 min folding
  washing: 40,   // ~remaining wash + folding
};
const MINUTES_PER_BAG_AHEAD = 120; // each bag ahead adds ~2 hours

function computeETA(status: WorkflowStatus, updatedAt: string, aheadCount: number): Date | null {
  const base = BASE_ETA_MINUTES[status];
  if (base === undefined) return null;
  const totalMins = base + aheadCount * MINUTES_PER_BAG_AHEAD;
  return new Date(new Date(updatedAt).getTime() + totalMins * 60 * 1000);
}

function formatCountdown(eta: Date): string {
  const diff = Math.max(0, eta.getTime() - Date.now());
  const totalMins = Math.round(diff / 60000);
  if (totalMins <= 0) return "Any moment now";
  if (totalMins < 60) return `~${totalMins} min`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

export default function TrackOrder() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Live-polling workflow from Dhobi Terminal — refreshes every 8 seconds
  const { data: workflow, isLoading: wfLoading, dataUpdatedAt } = useQuery<Workflow | null>({
    queryKey: ["/api/student/workflow"],
    queryFn: async () => {
      const res = await fetch("/api/student/workflow", { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 8000,
    staleTime: 0,
  });

  const { data: queuePos } = useQuery<{ aheadCount: number; position: number }>({
    queryKey: ["/api/student/queue-position"],
    queryFn: async () => {
      const res = await fetch("/api/student/queue-position", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
    enabled: !!workflow && (workflow.status === "hand_in" || workflow.status === "washing"),
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    queryFn: async () => {
      const res = await fetch("/api/sessions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
    queryFn: async () => {
      const res = await fetch("/api/machines", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const completeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest("PATCH", `/api/sessions/${sessionId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/machines"] });
      qc.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Session marked as complete." });
    },
  });

  const activeSessions = sessions.filter((s) => s.status === "active");
  const activeSession = activeSessions[0];
  const activeMachine = activeSession ? machines.find((m) => m.id === activeSession.machineId) : null;
  const endsAt = activeSession?.endsAt ? new Date(activeSession.endsAt) : null;
  const now = new Date();
  const minsLeft = endsAt ? Math.max(0, Math.round((endsAt.getTime() - now.getTime()) / 60000)) : null;

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Monitor your laundry progress in real time</h2>
      </div>

      {/* ── Dhobi Workflow Status (live) ─────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Laundry Workflow</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "4s" }} />
            {lastUpdated ? `Updated ${lastUpdated}` : "Live tracking"}
          </div>
        </div>

        {wfLoading ? (
          <div className="bg-white rounded-3xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#2962ff] animate-spin" />
            <span className="text-slate-500 font-medium">Loading status…</span>
          </div>
        ) : !workflow ? (
          <div className="bg-white rounded-3xl p-10 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 text-center">
            <div className="w-16 h-16 bg-[#f0f4ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-[#2962ff]" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">Waiting to be scanned</h4>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Hand your laundry bag to the Dhobi staff. They will scan your QR code to start tracking your order.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
            {/* Status banner */}
            <div className={clsx(
              "px-8 py-4 flex items-center justify-between",
              workflow.status === "delivered" ? "bg-emerald-50 border-b border-emerald-100" :
              workflow.status === "ready_for_pickup" ? "bg-blue-50 border-b border-blue-100" :
              "bg-[#f8faff] border-b border-slate-100"
            )}>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#2962ff] uppercase">Current Status</span>
                <p className={clsx(
                  "text-xl font-bold mt-0.5",
                  workflow.status === "delivered" ? "text-emerald-700" :
                  workflow.status === "ready_for_pickup" ? "text-blue-700" :
                  "text-slate-800"
                )}>
                  {statusLabel(workflow.status)}
                </p>
              </div>
              <div className="text-right">
                {workflow.bagId && (
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Bag ID</span>
                    <p className="font-bold text-slate-700 text-sm">{workflow.bagId}</p>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Last update: {new Date(workflow.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            {/* ETA card — only when laundry is in progress */}
            {(() => {
              const aheadCount = queuePos?.aheadCount ?? 0;
              const eta = computeETA(workflow.status, workflow.updatedAt, aheadCount);
              if (!eta) return null;
              const countdown = formatCountdown(eta);
              const readyTime = eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const isPast = eta.getTime() < Date.now();
              return (
                <div className="mx-8 mt-5 rounded-2xl overflow-hidden border border-[#e0eaff] bg-gradient-to-r from-[#f0f4ff] to-[#f8fbff] flex items-stretch">
                  <div className="w-1.5 shrink-0 bg-[#2962ff]" />
                  <div className="flex-1 flex flex-col px-5 py-4 gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2962ff]/10 flex items-center justify-center shrink-0">
                          <Timer className="w-5 h-5 text-[#2962ff]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-[#2962ff] uppercase">Estimated Ready for Pickup</p>
                          <p className="text-sm font-semibold text-slate-700 mt-0.5">
                            {isPast ? "Should be ready very soon" : `Ready around ${readyTime}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={clsx(
                          "text-lg font-black tracking-tight",
                          isPast ? "text-emerald-600" : "text-slate-800"
                        )}>
                          {countdown}
                        </div>
                        {!isPast && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">remaining</p>
                        )}
                      </div>
                    </div>
                    {aheadCount > 0 && (
                      <p className="text-[11px] text-slate-500 font-medium pl-1">
                        {aheadCount === 1
                          ? "1 bag ahead of yours in the queue"
                          : `${aheadCount} bags ahead of yours in the queue`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Progress bar */}
            <div className="px-8 pt-8 pb-2">
              <div className="relative">
                <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 rounded-full" />
                <div
                  className="absolute top-5 left-0 h-1 bg-[#2962ff] rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent(workflow.status)}%` }}
                />
                <div className="flex justify-between relative z-10">
                  {workflowSteps.map((step) => {
                    const state = getStepState(step.id, workflow.status);
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="flex flex-col items-center gap-3 w-24">
                        <div className={clsx(
                          "w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white transition-all duration-500",
                          state === "completed" ? "bg-[#2962ff] text-white shadow-lg shadow-blue-500/30" :
                          state === "active" ? "bg-[#0b2b8c] text-white shadow-lg scale-110" :
                          "bg-slate-100 text-slate-400"
                        )}>
                          {state === "completed"
                            ? <CheckCircle2 className="w-5 h-5" />
                            : <Icon className="w-5 h-5" />
                          }
                        </div>
                        <span className={clsx("text-xs font-bold text-center leading-tight", state !== "pending" ? "text-slate-800" : "text-slate-400")}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="px-8 pt-6 pb-8">
              <div className="relative border-l-2 border-slate-100 ml-4 space-y-6">
                {workflowSteps.map((step) => {
                  const state = getStepState(step.id, workflow.status);
                  return (
                    <div key={step.id} className="relative pl-8">
                      <div className={clsx(
                        "absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white",
                        state === "completed" ? "bg-[#2962ff]" :
                        state === "active" ? "bg-[#0b2b8c] ring-2 ring-[#2962ff]/30" :
                        "bg-slate-200"
                      )} />
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className={clsx("font-bold text-sm", state !== "pending" ? "text-slate-800" : "text-slate-400")}>
                            {step.label}
                          </h5>
                          <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
                        </div>
                        <span className={clsx(
                          "text-xs font-bold px-3 py-1 rounded-full ml-4 shrink-0",
                          state === "completed" ? "bg-[#f0f4ff] text-[#2962ff]" :
                          state === "active" ? "bg-[#0b2b8c] text-white" :
                          "text-slate-300"
                        )}>
                          {state === "completed" ? "Done" : state === "active" ? "Now" : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Machine Session (existing) ─────────────────── */}
      {activeSession && (
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <div className="flex-1 bg-white rounded-3xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#2962ff] uppercase tracking-wider">Machine Session</span>
              <h3 className="text-2xl font-bold mt-2 text-slate-800 capitalize">{activeMachine?.type === "washer" ? "Washing" : "Drying"}</h3>
              <p className="text-slate-500 mt-2 font-medium">{activeMachine?.name} · {activeMachine?.location}</p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="w-16 h-16 bg-[#f0f4ff] rounded-2xl flex items-center justify-center">
                <Droplet className="w-8 h-8 text-[#2962ff] fill-[#2962ff]" />
              </div>
              <button
                onClick={() => completeSession.mutate(activeSession.id)}
                disabled={completeSession.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
              >
                Mark Done
              </button>
            </div>
          </div>

          <div className="w-full lg:w-80 bg-[#111828] rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <Clock className="w-6 h-6 text-slate-400" />
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETA</span>
                <p className="text-2xl font-bold mt-1">{minsLeft !== null ? `${minsLeft} Mins` : "—"}</p>
              </div>
            </div>
            <div className="mt-8 relative z-10">
              <p className="text-sm text-slate-400 mb-1">Ready by</p>
              <p className="text-xl font-bold">
                {endsAt ? endsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification hint ─────────────────── */}
      <div className="bg-[#f8faff] rounded-3xl p-6 border border-[#e5edff] flex space-x-4 items-start">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
          <Bell className="w-5 h-5 text-[#2962ff]" />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium mt-1">
          You'll receive a notification each time your laundry status changes. The page also refreshes automatically every 8 seconds.
        </p>
      </div>
    </div>
  );
}
