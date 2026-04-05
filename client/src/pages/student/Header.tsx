import { Search, Bell } from "lucide-react";

interface HeaderProps {
  username: string;
  role: string;
  onNotificationsClick: () => void;
}

export default function Header({ username, role, onNotificationsClick }: HeaderProps) {
  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-100 shrink-0">
      <div className="w-96 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search orders, items..."
          className="w-full bg-[#f0f3f8] text-sm text-slate-700 rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#2962ff]/20"
        />
      </div>

      <div className="flex items-center space-x-6">
        <button
          onClick={onNotificationsClick}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          data-testid="header-notifications-btn"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800 leading-none">
              Hello, {username} <span className="inline-block text-lg ml-0.5">👋</span>
            </p>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider mt-1 uppercase">{role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=e2e8f0`}
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
