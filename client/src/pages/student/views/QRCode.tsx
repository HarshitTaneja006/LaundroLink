import { QRCodeSVG } from "qrcode.react";
import { Download, Smartphone, ShieldCheck } from "lucide-react";
import { useRef } from "react";

interface QRCodeViewProps {
  username: string;
}

export default function QRCodeView({ username }: QRCodeViewProps) {
  const qrRef = useRef<SVGSVGElement>(null);

  const handleDownload = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `laundrolink-qr-${username}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">My QR Code</h2>
        <p className="text-slate-500 mt-3 text-lg leading-relaxed">
          Show this QR code to staff for quick identity verification at the collection point.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* QR Card */}
        <div className="flex-1 bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 flex flex-col items-center justify-center">
          <div className="bg-[#f8fafc] rounded-3xl p-8 border border-slate-100 flex items-center justify-center mb-6">
            <QRCodeSVG
              ref={qrRef}
              value={username}
              size={220}
              bgColor="#f8fafc"
              fgColor="#111828"
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Student ID</p>
            <p className="text-2xl font-black text-slate-800 tracking-widest font-mono">{username}</p>
          </div>

          <button
            onClick={handleDownload}
            className="bg-[#111828] hover:bg-slate-700 text-white text-sm font-bold py-4 px-8 rounded-full flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/20"
          >
            <Download className="w-4 h-4" />
            Download QR Code
          </button>
        </div>

        {/* Info panel */}
        <div className="w-full lg:w-[340px]">
          <div className="bg-[#111828] rounded-[2rem] p-10 shadow-xl text-white relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#2962ff]/20 to-transparent rounded-bl-[100px]" />

            <div className="flex items-center mb-12 relative z-10">
              <Smartphone className="w-8 h-8 text-[#2962ff]" />
            </div>

            <div className="relative z-10 flex-1 space-y-8">
              <div>
                <h4 className="font-bold text-2xl mb-4 tracking-tight">How to use</h4>
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-medium">
                  {[
                    { step: "1", text: "Show this QR code to laundry staff at the collection point." },
                    { step: "2", text: "Staff scan it to instantly verify your student identity." },
                    { step: "3", text: "Collect your laundry or claimed lost item." },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex gap-4 items-start">
                      <div className="w-7 h-7 rounded-full bg-[#2962ff]/20 border border-[#2962ff]/30 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#2962ff] text-xs font-bold">{step}</span>
                      </div>
                      <p>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-5 relative z-10 flex items-start gap-4 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-[#2962ff] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Your QR code encodes only your student username. No personal or payment data is stored in it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
