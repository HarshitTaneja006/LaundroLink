import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const timeSlots = [
  { day: "Monday",    from: "08:00", to: "10:00", label: "Hostel Block A" },
  { day: "Monday",    from: "10:30", to: "12:30", label: "Hostel Block B" },
  { day: "Tuesday",   from: "08:00", to: "10:00", label: "Hostel Block C" },
  { day: "Tuesday",   from: "14:00", to: "16:00", label: "Hostel Block D" },
  { day: "Wednesday", from: "09:00", to: "11:00", label: "Hostel Block A" },
  { day: "Thursday",  from: "08:00", to: "10:00", label: "Hostel Block B" },
  { day: "Thursday",  from: "13:00", to: "15:00", label: "Hostel Block C" },
  { day: "Friday",    from: "10:00", to: "12:00", label: "Hostel Block D" },
  { day: "Saturday",  from: "09:00", to: "13:00", label: "All Blocks (Weekend)" },
];

const scheduledDates: number[] = [1, 5, 8, 12, 15, 19, 22, 26, 29];

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const days: (number | null)[] = Array(first).fill(null);
  const total = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= total; i++) days.push(i);
  return days;
}

export default function SchedulePage() {
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const days = buildCalendar(calYear, calMonth);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  const isToday = (d: number) => d === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();

  return (
    <div className="p-7 overflow-y-auto flex-1">
      <div className="mb-6">
        <h2 className="text-[22px] font-bold tracking-tight">Laundry Schedule</h2>
        <p className="text-gray-500 text-[13px] mt-1">Manage pickup and drop-off time slots for each hostel block.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-[10px] p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">‹</button>
              <span className="text-[14px] font-semibold">{MONTHS[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-md flex items-center justify-center text-[12px] font-medium transition-colors
                    ${!d ? "" : isToday(d) ? "text-white font-bold" : scheduledDates.includes(d) ? "font-semibold" : ""}
                  `}
                  style={{
                    background: !d ? "transparent" : isToday(d) ? "#166534" : scheduledDates.includes(d) ? "#dcfce7" : "transparent",
                    color: !d ? "transparent" : isToday(d) ? "#fff" : scheduledDates.includes(d) ? "#166534" : "#374151",
                    cursor: d ? "pointer" : "default",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: "#166534" }} />
                Today
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: "#dcfce7" }} />
                Scheduled
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-[10px] p-5">
            <div className="text-[13px] font-bold mb-3">Facility Hours</div>
            {[
              { day: "Mon–Fri", hours: "08:00 – 18:00" },
              { day: "Saturday", hours: "09:00 – 13:00" },
              { day: "Sunday",  hours: "Closed" },
            ].map(h => (
              <div key={h.day} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-[13px] text-gray-600">{h.day}</span>
                <span className={`text-[13px] font-semibold ${h.hours === "Closed" ? "text-red-500" : "text-gray-900"}`}>{h.hours}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-[14px] font-bold">Weekly Slots</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">Assigned laundry time windows for each hostel block</p>
            </div>
            <button
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              data-testid="schedule-add"
            >
              + Add Slot
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {["Day", "From", "To", "Block / Label", "Action"].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold tracking-wide uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors" data-testid={`row-slot-${i}`}>
                    <td className="px-5 py-3.5 text-[13px] font-semibold">{slot.day}</td>
                    <td className="px-5 py-3.5 font-mono text-[13px] text-blue-600">{slot.from}</td>
                    <td className="px-5 py-3.5 font-mono text-[13px] text-blue-600">{slot.to}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-600">{slot.label}</td>
                    <td className="px-5 py-3.5">
                      <button className="text-[12px] text-gray-400 hover:text-red-500 transition-colors" data-testid={`delete-slot-${i}`}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
