import { User, Mail, Building, Calendar, Shield, Edit2, Check, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProfileProps {
  username: string;
  role: string;
  email?: string | null;
  displayName?: string | null;
}

export default function Profile({ username, role, email, displayName }: ProfileProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(displayName || "");
  const [editEmail, setEditEmail] = useState(email || "");

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/profile", {
        displayName: editName || undefined,
        email: editEmail || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated!" });
      setEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Profile</h2>
        <p className="text-slate-500 mt-2">Your account information and preferences</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center gap-8">
          <div className="w-24 h-24 rounded-3xl bg-slate-100 overflow-hidden ring-4 ring-white shadow-lg shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.abs(username.split('').reduce((a, b) => a + b.charCodeAt(0), 0))}&backgroundColor=e2e8f0`}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-800">{displayName || username}</h3>
            <p className="text-slate-500 mt-1 capitalize">{role} · Active Scholar</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="bg-[#f0f4ff] text-[#2962ff] text-xs font-bold px-3 py-1 rounded-full capitalize">{role}</span>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">Active</span>
            </div>
          </div>
          <button
            onClick={() => { setEditing(!editing); setEditName(displayName || ""); setEditEmail(email || ""); }}
            className="p-3 rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        {editing && (
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-[#2962ff]/20">
            <h4 className="font-bold text-slate-800 mb-6 text-lg">Edit Profile</h4>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Display Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-[#f8fafc] text-slate-700 text-sm font-medium rounded-2xl px-5 py-4 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2962ff]/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-[#f8fafc] text-slate-700 text-sm font-medium rounded-2xl px-5 py-4 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2962ff]/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => updateProfile.mutate()}
                  disabled={updateProfile.isPending}
                  className="bg-[#2962ff] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {updateProfile.isPending ? "Saving…" : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-6 text-lg">Account Details</h4>
          <div className="space-y-5">
            {[
              { icon: User,    label: "Username",   value: username },
              { icon: Mail,    label: "Email",      value: email || "Not set" },
              { icon: Building,label: "Hostel Block",value: "Block B" },
              { icon: Calendar,label: "Member Since",value: "2024" },
              { icon: Shield,  label: "Role",       value: role.charAt(0).toUpperCase() + role.slice(1) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#f8fafc] rounded-2xl flex items-center justify-center shrink-0 border border-slate-100">
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
