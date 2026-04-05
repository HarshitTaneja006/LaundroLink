import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Search, LogIn, Waves, CheckCircle, Truck, ChevronRight, ArrowRight, ArrowLeft, Camera, Upload, Send, CheckCircle2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Lang = "en" | "ta";
type Screen = "scanner" | "user_status" | "report_found";
type WorkflowStatus = "hand_in" | "washing" | "ready_for_pickup" | "delivered";

interface StudentData {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  workflow: { status: WorkflowStatus; bagId: string | null; updatedAt: string } | null;
}

const T = {
  en: {
    terminal: "DHOBI TERMINAL",
    signOut: "Sign Out",
    reportFound: "Report Found",
    cantScan: "CAN'T SCAN? ENTER ID MANUALLY",
    studentIdPlaceholder: "Student ID (e.g. 25BAI1234)",
    go: "Go",
    userStatus: "USER STATUS",
    bagId: "Bag ID",
    active: "ACTIVE",
    statusWorkflow: "STATUS WORKFLOW",
    completed: "COMPLETED",
    current: "CURRENT",
    pending: "PENDING",
    advanceNext: "ADVANCE TO NEXT STAGE",
    allDone: "ALL DONE — DELIVERED!",
    scanNext: "← SCAN NEXT STUDENT",
    steps: {
      hand_in: "HAND IN",
      washing: "WASHING",
      ready_for_pickup: "READY FOR PICKUP",
      delivered: "DELIVERED",
    },
    reportFoundTitle: "REPORT FOUND ITEM",
    tapUpload: "TAP TO UPLOAD PHOTO",
    uploadHint: "PNG, JPG — optional",
    clothingType: "CLOTHING TYPE",
    color: "COLOR",
    whereFound: "WHERE FOUND",
    description: "DESCRIPTION",
    descPlaceholder: "Describe the item in detail…",
    submitting: "SUBMITTING…",
    submitReport: "SUBMIT REPORT",
    reportSubmitted: "Report Submitted!",
    reportSubmittedDesc: "The found item is now visible to students. AI matching will notify owners automatically.",
    backToScanner: "← BACK TO SCANNER",
    selectDots: "Select…",
    cameraError: "Camera access denied. Please allow camera permissions.",
    cameraHint: "Grant camera permission and reload.",
    clothingOpts: ["T-Shirt", "Hoodie", "Jeans", "Jacket", "Dress", "Shorts", "Other"],
    colorOpts: ["Black", "White", "Grey", "Blue", "Red", "Green", "Other"],
    locationOpts: ["Building A - Ground Floor", "Building B - Level 1", "Block A - Collection Point", "Block B - Collection Point", "Other"],
    fillAll: "Please fill all fields",
    submissionFailed: "Submission failed",
    studentNotFound: "Student not found",
    studentNotFoundLoggedIn: "You must be logged in as staff to use the Dhobi Terminal.",
    studentNotFoundScan: (scanned: string) => `Scanned: "${scanned}" — no student account found.`,
    errorFetching: "Error fetching student",
    failedUpdate: "Failed to update status",
    langLabel: "EN",
    langOther: "தமிழ்",
  },
  ta: {
    terminal: "தோபி டெர்மினல்",
    signOut: "வெளியேறு",
    reportFound: "கண்டுபிடிப்பு",
    cantScan: "ஸ்கேன் முடியவில்லையா? ID மூலம் உள்ளிடுக",
    studentIdPlaceholder: "மாணவர் ID (எ.கா. 25BAI1234)",
    go: "சரி",
    userStatus: "பயனர் நிலை",
    bagId: "பை ID",
    active: "செயல்",
    statusWorkflow: "நிலை ஓட்டம்",
    completed: "முடிந்தது",
    current: "தற்போது",
    pending: "நிலுவை",
    advanceNext: "அடுத்த கட்டம்",
    allDone: "முடிந்தது — வழங்கப்பட்டது!",
    scanNext: "← அடுத்த மாணவரை ஸ்கேன் செய்",
    steps: {
      hand_in: "ஒப்படை",
      washing: "துவைத்தல்",
      ready_for_pickup: "எடுக்க தயார்",
      delivered: "வழங்கப்பட்டது",
    },
    reportFoundTitle: "கண்டுபிடிப்பு அறிவி",
    tapUpload: "புகைப்படம் பதிவேற்ற தட்டுக",
    uploadHint: "PNG, JPG — விருப்பம்",
    clothingType: "ஆடை வகை",
    color: "நிறம்",
    whereFound: "எங்கே கிடைத்தது",
    description: "விளக்கம்",
    descPlaceholder: "பொருளை விரிவாக விவரிக்கவும்…",
    submitting: "சமர்ப்பிக்கிறது…",
    submitReport: "அறிக்கை சமர்ப்பி",
    reportSubmitted: "அறிக்கை சமர்ப்பிக்கப்பட்டது!",
    reportSubmittedDesc: "கண்டுபிடிக்கப்பட்ட பொருள் மாணவர்களுக்கு தெரியும். AI பொருத்தம் தோற்றுவிப்பாட்களை தானாக அறிவிக்கும்.",
    backToScanner: "← ஸ்கேனருக்கு திரும்பு",
    selectDots: "தேர்ந்தெடு…",
    cameraError: "கேமரா அனுமதி மறுக்கப்பட்டது. அனுமதி வழங்கவும்.",
    cameraHint: "கேமரா அனுமதி அளித்து மீண்டும் ஏற்றவும்.",
    clothingOpts: ["டி-ஷர்ட்", "ஹுடி", "ஜீன்ஸ்", "ஜாக்கெட்", "ஆடை", "ஷார்ட்ஸ்", "மற்றவை"],
    colorOpts: ["கருப்பு", "வெள்ளை", "சாம்பல்", "நீலம்", "சிவப்பு", "பச்சை", "மற்றவை"],
    locationOpts: ["கட்டிடம் A - கீழ் தளம்", "கட்டிடம் B - நிலை 1", "தொகுதி A - சேகரிப்பு இடம்", "தொகுதி B - சேகரிப்பு இடம்", "மற்றவை"],
    fillAll: "அனைத்து தகவல்களையும் நிரப்பவும்",
    submissionFailed: "சமர்ப்பிப்பு தோல்வி",
    studentNotFound: "மாணவர் கிடைக்கவில்லை",
    studentNotFoundLoggedIn: "தோபி டெர்மினலை பயன்படுத்த ஊழியராக உள்நுழைய வேண்டும்.",
    studentNotFoundScan: (scanned: string) => `ஸ்கேன்: "${scanned}" — மாணவர் கணக்கு இல்லை.`,
    errorFetching: "மாணவரை பெற தோல்வி",
    failedUpdate: "நிலை புதுப்பிக்க தோல்வி",
    langLabel: "தமிழ்",
    langOther: "EN",
  },
} as const;

const stepOrder: WorkflowStatus[] = ["hand_in", "washing", "ready_for_pickup", "delivered"];

function getState(stepId: WorkflowStatus, current: WorkflowStatus) {
  const ci = stepOrder.indexOf(current);
  const si = stepOrder.indexOf(stepId);
  if (si < ci) return "completed";
  if (si === ci) return "active";
  return "pending";
}

function DhobiLogo({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <rect x="2" y="5" width="16" height="10" rx="2" stroke="#4f8ef7" strokeWidth="1.5" />
      <path d="M7 5V3M13 5V3" stroke="#4f8ef7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 9h16" stroke="#4f8ef7" strokeWidth="1.5" />
      <circle cx="6" cy="13" r="1" fill="#4f8ef7" />
      <circle cx="10" cy="13" r="1" fill="#4f8ef7" />
    </svg>
  );
}

function LangToggle({ lang, onToggle }: { lang: Lang; onToggle: () => void }) {
  const t = T[lang];
  return (
    <button
      onClick={onToggle}
      data-testid="lang-toggle"
      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-[10px] font-bold tracking-wide"
      title={`Switch to ${lang === "en" ? "Tamil" : "English"}`}
    >
      <span className="text-[#4f8ef7]">{t.langLabel}</span>
      <span className="text-white/20">|</span>
      <span className="text-white/40">{t.langOther}</span>
    </button>
  );
}

function Header({
  rightSlot, onBack, lang, onToggleLang,
}: {
  rightSlot?: React.ReactNode;
  onBack?: () => void;
  lang: Lang;
  onToggleLang: () => void;
}) {
  const t = T[lang];
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#0d1826] border-b border-white/[0.06] flex-shrink-0">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="mr-1 text-[#5a6a7a] hover:text-white transition-colors p-1">
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="w-7 h-7 rounded-lg bg-[#1a2d40] flex items-center justify-center">
          <DhobiLogo size={16} />
        </div>
        <span className="text-[11px] font-bold tracking-[0.2em] text-white">{t.terminal}</span>
      </div>
      <div className="flex items-center gap-2">
        <LangToggle lang={lang} onToggle={onToggleLang} />
        {rightSlot}
      </div>
    </div>
  );
}

function ManualEntry({ onSubmit, lang }: { onSubmit: (username: string) => void; lang: Lang }) {
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue("");
    setOpen(false);
    onSubmit(trimmed);
  };

  return (
    <div className="px-5 pt-3 pb-4 bg-[#0d1826]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-[10px] tracking-[0.2em] text-[#4a6a82] hover:text-[#4f8ef7] transition-colors text-center py-2 border border-white/[0.06] rounded-xl"
          data-testid="manual-entry-toggle"
        >
          {t.cantScan}
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            placeholder={t.studentIdPlaceholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="flex-1 bg-[#111f2e] border border-white/10 rounded-xl text-white text-xs px-4 py-3 outline-none placeholder:text-white/30 focus:border-[#4f8ef7]/50"
            data-testid="manual-entry-input"
          />
          <button
            onClick={handleSubmit}
            className="bg-[#4f8ef7] text-white text-xs font-bold px-4 rounded-xl shrink-0"
            data-testid="manual-entry-go"
          >
            {t.go}
          </button>
          <button
            onClick={() => { setOpen(false); setValue(""); }}
            className="text-white/40 text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function QRScannerView({ onScanSuccess, lang }: { onScanSuccess: (data: string) => void; lang: Lang }) {
  const t = T[lang];
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const qr = new Html5Qrcode("qr-reader");
    scannerRef.current = qr;

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 200, height: 200 } },
      (decodedText) => { onScanSuccess(decodedText); },
      () => {}
    ).catch(() => setError(t.cameraError));

    return () => {
      try { qr.stop().catch(() => {}); } catch {}
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      <div id="qr-reader" className="w-full h-full" style={{ maxWidth: 300 }} />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1826]/90 px-6 text-center">
          <div>
            <Camera size={40} className="text-[#4f8ef7] mx-auto mb-3" />
            <p className="text-white text-sm font-medium mb-1">{error}</p>
            <p className="text-[#4a6a82] text-xs">{t.cameraHint}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function UserStatus({
  student, onStatusChange, onNextStudent, updating, lang,
}: {
  student: StudentData;
  onStatusChange: (s: WorkflowStatus) => void;
  onNextStudent: () => void;
  updating: boolean;
  lang: Lang;
}) {
  const t = T[lang];
  const current: WorkflowStatus = student.workflow?.status || "hand_in";
  const allDone = current === "delivered";

  const advance = () => {
    const ci = stepOrder.indexOf(current);
    if (ci < stepOrder.length - 1) onStatusChange(stepOrder[ci + 1]);
  };

  const initials = (student.displayName || student.username).slice(0, 2).toUpperCase();
  const bagId = student.workflow?.bagId || `#${student.username.slice(-4).toUpperCase()}`;

  const stepIcons = [
    { id: "hand_in" as WorkflowStatus, icon: LogIn },
    { id: "washing" as WorkflowStatus, icon: Waves },
    { id: "ready_for_pickup" as WorkflowStatus, icon: CheckCircle },
    { id: "delivered" as WorkflowStatus, icon: Truck },
  ];

  return (
    <div className="flex flex-col gap-0 pb-4">
      <div className="px-4 pt-5 pb-1">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#4a6a82]">{t.userStatus}</p>
      </div>

      <div className="mx-4 mt-2 bg-[#111f2e] rounded-2xl p-3 flex items-center gap-3 border border-[#1e3048]">
        <div className="w-14 h-14 rounded-xl bg-[#1e3048] flex items-center justify-center text-white text-xl font-black shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[15px] leading-tight truncate">
            {student.displayName || student.username}
          </p>
          <p className="text-[11px] text-[#4a6a82] mt-0.5 truncate">{student.email || student.username}</p>
          <p className="text-[9px] text-[#3a5a72] mt-1 tracking-wider uppercase">{t.bagId}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-black bg-green-500 text-black px-1.5 py-[2px] rounded tracking-widest leading-tight">{t.active}</span>
            <span className="text-[13px] font-bold text-white tracking-wide">{bagId}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-1">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#4a6a82]">{t.statusWorkflow}</p>
      </div>

      <div className="px-4 flex flex-col gap-2">
        {stepIcons.map((step) => {
          const state = getState(step.id, current);
          const Icon = step.icon;
          const label = t.steps[step.id];
          return (
            <button
              key={step.id}
              onClick={() => onStatusChange(step.id)}
              disabled={updating}
              data-testid={`step-${step.id}`}
              className={`w-full flex items-center justify-between px-4 py-[14px] rounded-xl transition-all duration-150 disabled:opacity-60 ${
                state === "active"
                  ? "bg-[#4f8ef7] shadow-lg shadow-[#4f8ef7]/25 hover:bg-[#5a98ff]"
                  : state === "completed"
                  ? "bg-[#0e2a1c] border border-[#1a4a2e] hover:bg-[#112d1f]"
                  : "bg-[#111f2e] border border-[#1a2e40] hover:bg-[#152535]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={17} className={state === "active" ? "text-white" : state === "completed" ? "text-green-400" : "text-[#2e4a5a]"} />
                <div className="text-left">
                  <p className={`text-[11px] font-bold tracking-[0.1em] ${state === "active" ? "text-white" : state === "completed" ? "text-green-300" : "text-[#2e4a5a]"}`}>
                    {label}
                  </p>
                  <p className={`text-[9px] tracking-widest mt-0.5 ${state === "active" ? "text-white/60" : state === "completed" ? "text-green-600" : "text-[#243545]"}`}>
                    {state === "completed" ? t.completed : state === "active" ? t.current : t.pending}
                  </p>
                </div>
              </div>
              {state === "completed" ? (
                <span className="w-6 h-6 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
              ) : (
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${state === "active" ? "bg-white/20" : "bg-[#1a2e40]"}`}>
                  <ChevronRight size={13} className={state === "active" ? "text-white" : "text-[#2e4a5a]"} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!allDone && (
        <div className="px-4 mt-3">
          <button onClick={advance} disabled={updating}
            className="w-full py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/25 text-green-400 text-[11px] font-bold tracking-[0.1em] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            data-testid="advance-btn">
            {t.advanceNext} <ArrowRight size={13} />
          </button>
        </div>
      )}
      {allDone && (
        <div className="mx-4 mt-3 py-3 px-4 rounded-xl bg-green-500/10 border border-green-500/25 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <p className="text-green-300 text-[11px] font-bold tracking-widest">{t.allDone}</p>
        </div>
      )}
      <div className="px-4 mt-3">
        <button onClick={onNextStudent}
          className="w-full py-3 rounded-xl bg-[#111f2e] hover:bg-[#152535] border border-[#1e3048] text-[#4a6a82] hover:text-[#7a9aaa] text-[11px] font-bold tracking-[0.1em] transition-all"
          data-testid="scan-next-btn">
          {t.scanNext}
        </button>
      </div>
    </div>
  );
}

function ReportFoundItem({ onBack, lang }: { onBack: () => void; lang: Lang }) {
  const { toast } = useToast();
  const t = T[lang];
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !color || !location || !description) {
      toast({ title: t.fillAll, variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (file) {
        const fd = new FormData();
        fd.append("photo", file);
        const r = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
        if (r.ok) imageUrl = (await r.json()).url;
      }
      const res = await fetch("/api/found-items", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clothingType: type, color, description, location, imageUrl }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      toast({ title: t.submissionFailed, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
          <CheckCircle2 size={30} className="text-green-400" />
        </div>
        <p className="text-white font-bold text-lg tracking-tight">{t.reportSubmitted}</p>
        <p className="text-[#4a6a82] text-sm leading-relaxed">{t.reportSubmittedDesc}</p>
        <button onClick={onBack}
          className="mt-4 px-6 py-3 rounded-xl bg-[#4f8ef7] text-white text-[11px] font-bold tracking-widest hover:bg-[#5a98ff] transition-colors">
          {t.backToScanner}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      <div className="pt-4 pb-2">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#4a6a82]">{t.reportFoundTitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-[#1e3048]">
              <img src={preview} className="w-full h-36 object-cover" alt="Preview" />
              <button type="button" onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#1e3048] rounded-xl p-6 text-center cursor-pointer hover:border-[#4f8ef7]/40 hover:bg-[#4f8ef7]/5 transition-colors">
              <Upload size={22} className="text-[#4a6a82] mx-auto mb-2" />
              <p className="text-[#4a6a82] text-xs font-semibold">{t.tapUpload}</p>
              <p className="text-[#2e4a5a] text-[10px] mt-1">{t.uploadHint}</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>

        {[
          { label: t.clothingType, val: type, set: setType, opts: t.clothingOpts },
          { label: t.color, val: color, set: setColor, opts: t.colorOpts },
          { label: t.whereFound, val: location, set: setLocation, opts: t.locationOpts },
        ].map(({ label, val, set, opts }) => (
          <div key={label}>
            <p className="text-[9px] font-bold tracking-[0.2em] text-[#4a6a82] mb-1">{label}</p>
            <div className="relative">
              <select value={val} onChange={e => set(e.target.value)}
                className="w-full bg-[#111f2e] border border-[#1e3048] text-white text-xs font-medium rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-[#4f8ef7]/50">
                <option value="">{t.selectDots}</option>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a6a82] rotate-90 pointer-events-none" />
            </div>
          </div>
        ))}

        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-[#4a6a82] mb-1">{t.description}</p>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
            placeholder={t.descPlaceholder}
            className="w-full bg-[#111f2e] border border-[#1e3048] text-white text-xs font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-[#4f8ef7]/50 resize-none placeholder-[#2e4a5a]" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#4f8ef7] hover:bg-[#5a98ff] disabled:opacity-60 text-white text-[11px] font-bold tracking-[0.15em] flex items-center justify-center gap-2 transition-colors"
          data-testid="submit-report-btn">
          <Send size={13} />
          {submitting ? t.submitting : t.submitReport}
        </button>
      </form>
    </div>
  );
}

export default function StaffScanner({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [lang, setLang] = useState<Lang>("en");
  const [screen, setScreen] = useState<Screen>("scanner");
  const [student, setStudent] = useState<StudentData | null>(null);
  const [scanPulse, setScanPulse] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [updating, setUpdating] = useState(false);

  const t = T[lang];
  const toggleLang = () => setLang(l => l === "en" ? "ta" : "en");

  const handleScanSuccess = async (rawText: string) => {
    if (scanned) return;
    const username = rawText.trim();
    if (!username) return;
    setScanned(true);
    setScanPulse(true);

    try {
      const res = await fetch(`/api/staff/student/${encodeURIComponent(username)}`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        let detail: string;
        if (res.status === 401 || res.status === 403) {
          detail = t.studentNotFoundLoggedIn;
        } else {
          detail = t.studentNotFoundScan(body.scanned ?? username);
        }
        toast({ title: t.studentNotFound, description: detail, variant: "destructive" });
        setScanPulse(false);
        setScanned(false);
        return;
      }
      const data: StudentData = await res.json();
      if (!data.workflow) {
        await fetch(`/api/staff/student/${encodeURIComponent(username)}/status`, {
          method: "PUT", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "hand_in" }),
        });
        data.workflow = { status: "hand_in", bagId: null, updatedAt: new Date().toISOString() };
      }
      setTimeout(() => {
        setScanPulse(false);
        setStudent(data);
        setScreen("user_status");
        setScanned(false);
      }, 700);
    } catch {
      toast({ title: t.errorFetching, variant: "destructive" });
      setScanPulse(false);
      setScanned(false);
    }
  };

  const handleStatusChange = async (status: WorkflowStatus) => {
    if (!student || updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/staff/student/${encodeURIComponent(student.username)}/status`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      setStudent(prev => prev ? { ...prev, workflow: { ...prev.workflow!, status } } : prev);
    } catch {
      toast({ title: t.failedUpdate, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleNextStudent = () => {
    setStudent(null);
    setScreen("scanner");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070d16] p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex items-center gap-1.5 text-white/50 hover:text-white/90 transition-colors z-10 text-xs font-semibold tracking-widest uppercase"
        data-testid="sign-out-btn"
      >
        <X size={14} />
        {t.signOut}
      </button>

      <div
        className="relative w-full max-w-[360px] rounded-[28px] overflow-hidden flex flex-col"
        style={{
          minHeight: "680px",
          maxHeight: "90vh",
          boxShadow: "0 0 0 1px #1a2535, 0 40px 80px rgba(0,0,0,0.7), 0 0 80px rgba(79,142,247,0.05)",
        }}
      >

        {/* SCANNER SCREEN */}
        {screen === "scanner" && (
          <div className="flex flex-col" style={{ minHeight: "680px" }}>
            <Header
              lang={lang}
              onToggleLang={toggleLang}
              rightSlot={
                <button onClick={() => setScreen("report_found")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#162030] hover:bg-[#1e2d3d] border border-[#243040] text-[#8a9aaa] hover:text-white transition-all text-[11px] font-semibold tracking-wide"
                  data-testid="report-found-btn">
                  <Search size={11} />
                  {t.reportFound}
                </button>
              }
            />

            <div className="flex-1 relative overflow-hidden"
              style={{ background: "linear-gradient(160deg,#1d6b56 0%,#1a8a68 25%,#0e9b7a 55%,#198f6a 80%,#157055 100%)" }}>
              <div className="absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.35) 100%)" }} />
              <div className="absolute left-0 right-0 h-px pointer-events-none"
                style={{
                  background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.7) 20%,rgba(255,255,255,0.9) 50%,rgba(255,255,255,0.7) 80%,transparent 100%)",
                  animation: "scanBeam 2.5s ease-in-out infinite",
                  top: scanPulse ? "80%" : "50%",
                  transition: "top 0.5s ease",
                }} />
              <QRScannerView onScanSuccess={handleScanSuccess} lang={lang} />
            </div>

            <ManualEntry onSubmit={handleScanSuccess} lang={lang} />
          </div>
        )}

        {/* USER STATUS SCREEN */}
        {screen === "user_status" && student && (
          <div className="flex flex-col overflow-y-auto" style={{ minHeight: "680px", background: "#0d1826" }}>
            <Header
              lang={lang}
              onToggleLang={toggleLang}
              onBack={handleNextStudent}
            />
            <UserStatus
              student={student}
              onStatusChange={handleStatusChange}
              onNextStudent={handleNextStudent}
              updating={updating}
              lang={lang}
            />
          </div>
        )}

        {/* REPORT FOUND SCREEN */}
        {screen === "report_found" && (
          <div className="flex flex-col" style={{ minHeight: "680px", background: "#0d1826" }}>
            <Header
              lang={lang}
              onToggleLang={toggleLang}
              onBack={() => setScreen("scanner")}
            />
            <ReportFoundItem onBack={() => setScreen("scanner")} lang={lang} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanBeam {
          0%,100% { top: 20%; opacity: 0.8; }
          50%      { top: 80%; opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
