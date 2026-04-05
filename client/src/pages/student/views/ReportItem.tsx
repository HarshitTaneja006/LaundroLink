import { Upload, ChevronDown, Info, ArrowRight, AlertCircle, X, ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getCsrfToken } from "@/lib/csrf";

export default function ReportItem() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 5MB.", variant: "destructive" });
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast({ title: "Invalid file type", description: "Only PNG, JPG, and WebP are allowed.", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      const fakeEvent = { target: { files: [f] } } as any;
      handleFileChange(fakeEvent);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const reportFound = useMutation({
    mutationFn: async () => {
      let imageUrl: string | undefined;

      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append("photo", file);
        const headers: Record<string, string> = {};
        const csrfToken = await getCsrfToken();
        if (csrfToken) {
          headers["X-CSRF-Token"] = csrfToken;
        }
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          headers,
          body: formData,
        });
        setUploading(false);
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.message || "Upload failed");
        }
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/found-items", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-Token": csrfToken }),
        },
        body: JSON.stringify({ clothingType: type, color, description, location, imageUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/found-items"] });
      toast({ title: "Item reported!", description: "Thank you. The item is now visible to all students." });
      setType(""); setColor(""); setLocation(""); setDescription("");
      removeFile();
    },
    onError: (err: Error) => {
      setUploading(false);
      toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !color || !location || !description) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    reportFound.mutate();
  };

  const isBusy = reportFound.isPending || uploading;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Report Item</h2>
        <p className="text-slate-500 mt-3 text-lg leading-relaxed">Found something that doesn't belong to you? Report it so the owner can claim it.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50">
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Where Found</label>
              <div className="relative">
                <select value={location} onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#f8fafc] text-slate-700 text-sm font-medium rounded-2xl px-5 py-4 appearance-none border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2962ff]/20">
                  <option value="">Select location</option>
                  <option>Building A - Ground Floor</option>
                  <option>Building B - Level 1</option>
                  <option>Block A - Collection Point</option>
                  <option>Block B - Collection Point</option>
                  <option>Other</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item as best as you can..."
                className="w-full bg-[#f8fafc] text-slate-700 text-sm font-medium rounded-2xl p-5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2962ff]/20 resize-none" />
              <div className="flex items-start space-x-2 mt-2 pl-1">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500 font-medium">Include any labels, tags, or identifying marks.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Photo (optional)</label>

              {preview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-[#f8fafc]">
                  <img src={preview} alt="Preview" className="w-full h-48 object-contain" />
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md border border-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-white/90 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {file?.name}
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-[#2962ff]/40 hover:bg-[#f8faff] transition-all cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => { e.preventDefault(); }}
                >
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP — max 5MB</p>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <button type="submit" disabled={isBusy}
              className="bg-[#111828] hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-bold py-4 px-8 rounded-full flex items-center space-x-2 transition-colors group shadow-lg shadow-slate-900/20">
              <span>
                {uploading ? "Uploading photo…" : reportFound.isPending ? "Submitting…" : "Submit Report"}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <div className="w-full lg:w-[340px]">
          <div className="bg-[#111828] rounded-[2rem] p-10 shadow-xl text-white relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#2962ff]/20 to-transparent rounded-bl-[100px]" />
            <div className="flex items-center mb-12 relative z-10">
              <AlertCircle className="w-8 h-8 text-[#2962ff]" />
            </div>
            <div className="relative z-10 flex-1">
              <h4 className="font-bold text-2xl mb-4 tracking-tight">Why report?</h4>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Reporting found items helps us reunite students with their belongings faster. Your report is visible to all students and cross-checked with lost item submissions.
              </p>
            </div>
            <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6 relative z-10 text-xs text-slate-300 leading-relaxed font-medium backdrop-blur-sm">
              Items not claimed within 30 days are donated to charity.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
