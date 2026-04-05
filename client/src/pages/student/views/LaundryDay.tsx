import { ChevronLeft, ChevronRight, Info, Bell } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

function getAssignedWeekdays(username: string): number[] {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i);
    hash |= 0;
  }
  const base = Math.abs(hash) % 5 + 1;
  const second = (base + 3) % 7 === 0 ? 4 : (base + 3) % 7;
  return [base === 0 ? 3 : base, second];
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_HEADERS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

function buildCalendarDays(year: number, month: number, assignedWeekdays: number[]) {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { date: number; disabled?: boolean; active?: boolean; prevMonth?: boolean }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: prevMonthDays - i, disabled: true, prevMonth: true });
  }
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    const jsToMon = dow === 0 ? 6 : dow - 1;
    const jsAssigned = assignedWeekdays.map(w => w === 0 ? 6 : w - 1);
    const active = jsAssigned.includes(jsToMon);
    cells.push({ date: d, active });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: cells.length - startOffset - daysInMonth + 1, disabled: true });
  }
  return cells;
}

interface LaundryDayProps {
  username: string;
}

export default function LaundryDay({ username }: LaundryDayProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const assignedWeekdays = getAssignedWeekdays(username);
  const days = buildCalendarDays(viewDate.year, viewDate.month, assignedWeekdays);

  const prevMonth = () => {
    setViewDate(v => {
      const d = new Date(v.year, v.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };
  const nextMonth = () => {
    setViewDate(v => {
      const d = new Date(v.year, v.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const assignedDayNames = assignedWeekdays.map(d => dayNames[d]).join(" & ");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Laundry Day</h2>
        <p className="text-slate-500 mt-2">Your laundry schedule is automatically assigned based on hostel room.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="bg-white rounded-3xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="bg-[#2962ff] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Assigned Days
                </span>
                <h3 className="text-2xl font-bold mt-4 tracking-tight">
                  {MONTH_NAMES[viewDate.month]} {viewDate.year}
                </h3>
              </div>
              <div className="flex space-x-2">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-full">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-full">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-6 mb-8">
              {DAY_HEADERS.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}
              {days.map((d, i) => (
                <div key={i} className="flex justify-center items-center">
                  <div
                    className={clsx(
                      "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-[14px] text-sm font-bold transition-all",
                      d.disabled ? "text-slate-300" : "text-slate-700",
                      d.active && "bg-[#0b2b8c] text-white shadow-lg scale-110",
                      !d.disabled && !d.active && "hover:bg-slate-100 cursor-pointer"
                    )}
                  >
                    {d.date}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#f0f4ff] border-l-4 border-[#2962ff] p-4 rounded-r-xl flex items-start space-x-3 mt-4">
              <Info className="w-5 h-5 text-[#2962ff] shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed">
                Your laundry is collected on your assigned days ({assignedDayNames}). Please keep your bag ready before{" "}
                <span className="font-semibold text-slate-800">8 AM</span> at the collection point of{" "}
                <span className="font-semibold text-slate-800">Block B.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[340px] space-y-6">
          <div className="bg-[#f8faff] rounded-3xl p-8 border border-[#e5edff]">
            <h4 className="font-bold text-slate-800 mb-8 text-lg">How it works</h4>
            <div className="space-y-8">
              {[
                "Laundry day is assigned automatically based on hostel room.",
                "Submit your clothes in your tagged laundry bag at the collection point.",
                "You will receive a notification when your clothes are picked up.",
                "You can track washing status in the dashboard.",
              ].map((text, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="w-8 h-8 rounded-full bg-white text-[#2962ff] font-bold text-sm flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed pt-1.5">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111828] rounded-3xl p-8 shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full" />
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/5 relative z-10">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-lg mb-3 relative z-10">Pickup Reminder</h4>
            <p className="text-sm text-slate-300 leading-relaxed relative z-10">
              Please ensure your laundry bag is tagged and ready before pickup day. Late bags may not be processed until the next cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
